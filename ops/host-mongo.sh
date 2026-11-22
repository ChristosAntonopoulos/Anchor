#!/bin/bash
# Anchor (pos) mongo access only. Never print passwords or connection strings.
set -euo pipefail
set +x
umask 077

ACTION="${1:-discover}"
if [ "$ACTION" != "apply" ]; then
  echo "This revision only supports apply."
  exit 2
fi

NS=pos
DEPLOY=pos-api
SECRET=pos-api-secrets
SECRET_KEY=ConnectionStrings__MongoDb
APP_USER=pos_app
DB_NAME=pos
PASS_FILE=/root/mongo-lockdown/pos_app.pass
ADMIN_FILE=/root/mongo-lockdown/admin.pass
WORKDIR=/root/mongo-lockdown
MONGO_HOST=10.244.0.0
VG_PROJECT=Anchor
VG_ID=4
VG_KEY=MONGO_CONNECTION_STRING

echo "when=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "host=$(hostname)"
echo "user=$(id -un)"
echo "tz_athens=$(TZ=Europe/Athens date '+%Y-%m-%d %H:%M:%S %Z')"

if [ "$(id -un)" != "root" ]; then
  echo "STOP must run as root on contabo-agent-2"
  exit 3
fi

if [ -z "${KUBECONFIG:-}" ] || [ ! -r "${KUBECONFIG}" ]; then
  if [ -r /etc/kubernetes/admin.conf ]; then
    export KUBECONFIG=/etc/kubernetes/admin.conf
  fi
fi
echo "kubeconfig=${KUBECONFIG:-unset}"

echo "=== bind ==="
ss -H -lnt | awk '$4 ~ /:27017$/ {print}'
awk '$1=="bindIp:" || $1=="authorization:" || $1=="port:" {print}' /etc/mongod.conf

echo "=== preconditions ==="
db_cfg=$(kubectl get configmap pos-api-config -n "$NS" -o jsonpath='{.data.MongoDb__DatabaseName}')
echo "config_database=${db_cfg}"
if [ "$db_cfg" != "$DB_NAME" ]; then
  echo "STOP config database is not ${DB_NAME}"
  exit 3
fi

pod_line=$(kubectl get pods -n "$NS" -l app=pos-api -o jsonpath='{range .items[*]}{.metadata.name}{" hostNetwork="}{.spec.hostNetwork}{" ip="}{.status.podIP}{" phase="}{.status.phase}{" ready="}{.status.containerStatuses[0].ready}{" restarts="}{.status.containerStatuses[0].restartCount}{"\n"}{end}')
echo "pod ${pod_line}"
pod_ip=$(printf '%s\n' "$pod_line" | awk '{for (i=1;i<=NF;i++) if ($i ~ /^ip=/) {split($i,a,"="); print a[2]}}' | head -1)
host_net=$(printf '%s\n' "$pod_line" | awk '{for (i=1;i<=NF;i++) if ($i ~ /^hostNetwork=/) {split($i,a,"="); print a[2]}}' | head -1)
if [ "$host_net" = "true" ]; then
  echo "STOP pod uses host network — do not open mongo publicly; report back"
  exit 3
fi
case "$pod_ip" in
  10.244.*) echo "pod_on_flannel=${pod_ip}" ;;
  *) echo "STOP pod IP ${pod_ip} is not on flannel"; exit 3 ;;
esac

if ! ss -H -lnt | awk '$4=="10.244.0.0:27017" {found=1} END {exit found?0:1}'; then
  echo "STOP mongod is not listening on 10.244.0.0:27017"
  exit 3
fi
if ss -H -lnt | awk '$4 ~ /185\.193\.66\.50:27017$/ || $4 ~ /0\.0\.0\.0:27017$/ {found=1} END {exit found?0:1}'; then
  echo "STOP public or wildcard bind is present"
  exit 3
fi

if [ ! -r "$ADMIN_FILE" ]; then
  echo "STOP admin password file missing"
  exit 3
fi

# Guardrails: do not touch tradingbot namespace / OliveLifecycle resources
echo "=== guardrails ==="
kubectl get ns tradingbot -o name >/dev/null
echo "tradingbot_ns=present (will not modify)"
kubectl get deploy -n agrotrack-backend olive-lifecycle-api -o name >/dev/null 2>&1 && echo "olive_deploy=present (will not modify)" || echo "olive_deploy=absent_or_other_ns"

mongo_admin() {
  local js="$1"
  docker run --rm --network host \
    -v "$ADMIN_FILE":/run/admin.pass:ro \
    -v "$js":/run/job.js:ro \
    mongo:7 \
    bash -lc 'set +x; exec mongosh "mongodb://127.0.0.1:27017/admin" --username tradingbot_admin --password "$(tr -d "\r\n" < /run/admin.pass)" --authenticationDatabase admin --quiet /run/job.js'
}

cat > "$WORKDIR/check-user.js" << 'JS'
const names = db.adminCommand({listDatabases:1, nameOnly:true}).databases.map(d => d.name);
if (!names.includes("pos")) {
  print("DB_MISSING");
  quit(3);
}
print("DB_PRESENT");
const info = db.getSiblingDB("pos").getUser("pos_app");
print(info ? "USER_EXISTS" : "USER_ABSENT");
JS
mongo_admin "$WORKDIR/check-user.js" | tee "$WORKDIR/check-user.out"
if ! grep -q "DB_PRESENT" "$WORKDIR/check-user.out"; then
  echo "STOP database missing"
  exit 3
fi
CREATE_USER=yes
if grep -q "USER_EXISTS" "$WORKDIR/check-user.out"; then
  if [ ! -r "$PASS_FILE" ]; then
    echo "STOP user exists and password file is missing"
    exit 3
  fi
  CREATE_USER=no
  echo "user_exists_reuse_password_file"
fi

echo "=== counts before ==="
cat > "$WORKDIR/counts.js" << 'JS'
const d = db.getSiblingDB("pos");
const st = d.stats();
print("STATS objects=" + st.objects + " collections=" + st.collections + " dataSize=" + st.dataSize);
d.getCollectionNames().sort().forEach(c => {
  print("COLL " + c + " " + d.getCollection(c).estimatedDocumentCount());
});
JS
mongo_admin "$WORKDIR/counts.js" | tee "$WORKDIR/counts-before.out"

echo "=== create user ==="
if [ "$CREATE_USER" = "yes" ]; then
  if [ -e "$PASS_FILE" ]; then
    echo "STOP password file already exists"
    exit 3
  fi
  openssl rand -hex 24 > "$PASS_FILE"
  chmod 600 "$PASS_FILE"
fi
echo "password_file=$PASS_FILE mode=$(stat -c '%a' "$PASS_FILE") bytes=$(wc -c < "$PASS_FILE")"

cat > "$WORKDIR/create-user.js" << 'JS'
const pwd = process.env.APP_PWD;
if (!pwd || !/^[0-9a-f]{48}$/.test(pwd)) {
  print("NO_PWD");
  quit(2);
}
const target = db.getSiblingDB("pos");
const existing = target.getUser("pos_app");
if (!existing) {
  try {
    target.createUser({
      user: "pos_app",
      pwd: pwd,
      roles: [{ role: "readWrite", db: "pos" }]
    });
    print("CREATED");
  } catch (e) {
    print("CREATE_FAIL " + (e.codeName || e.code));
    quit(1);
  }
} else {
  print("EXISTS");
}
const info = target.getUser("pos_app");
const roles = (info && info.roles) || [];
print("ROLES " + JSON.stringify(roles.map(r => r.role + "@" + r.db)));
const ok = roles.length === 1 && roles[0].role === "readWrite" && roles[0].db === "pos";
if (!ok) {
  print("ROLE_MISMATCH");
  quit(1);
}
print("ROLE_OK");
JS
docker run --rm --network host \
  -v "$ADMIN_FILE":/run/admin.pass:ro \
  -v "$PASS_FILE":/run/app.pass:ro \
  -v "$WORKDIR/create-user.js":/run/job.js:ro \
  mongo:7 \
  bash -lc 'set +x; export APP_PWD="$(tr -d "\r\n" < /run/app.pass)"; exec mongosh "mongodb://127.0.0.1:27017/admin" --username tradingbot_admin --password "$(tr -d "\r\n" < /run/admin.pass)" --authenticationDatabase admin --quiet /run/job.js'

echo "=== app auth check ==="
cat > "$WORKDIR/verify-app.js" << 'JS'
const ping = db.runCommand({ ping: 1 });
print("PING " + ping.ok);
const st = db.stats();
print("STATS objects=" + st.objects + " collections=" + st.collections);
db.getCollectionNames().sort().slice(0, 12).forEach(c => {
  print("COLL " + c + " " + db.getCollection(c).estimatedDocumentCount());
});
const status = db.runCommand({ connectionStatus: 1 });
((status.authInfo && status.authInfo.authenticatedUsers) || []).forEach(u => {
  print("AUTH " + u.user + " db=" + u.db);
});
try {
  const n = db.getSiblingDB("TradingBot").getCollectionNames().length;
  print("TB_UNEXPECTED " + n);
} catch (e) {
  print("TB_DENIED " + (e.codeName || e.code));
}
try {
  const n = db.getSiblingDB("OliveLifecycle").getCollectionNames().length;
  print("OL_UNEXPECTED " + n);
} catch (e) {
  print("OL_DENIED " + (e.codeName || e.code));
}
JS
docker run --rm --network host \
  -v "$PASS_FILE":/run/app.pass:ro \
  -v "$WORKDIR/verify-app.js":/run/job.js:ro \
  mongo:7 \
  bash -lc 'set +x; exec mongosh "mongodb://127.0.0.1:27017/pos" --username pos_app --password "$(tr -d "\r\n" < /run/app.pass)" --authenticationDatabase pos --quiet /run/job.js'

echo "=== point secret ==="
python3 - << 'PY'
import base64, json, pathlib, subprocess, urllib.parse
pwd = pathlib.Path("/root/mongo-lockdown/pos_app.pass").read_text().strip()
if len(pwd) != 48 or any(c not in "0123456789abcdef" for c in pwd):
    raise SystemExit("bad password file")
user = "pos_app"
host = "10.244.0.0:27017"
db = "pos"
uri = f"mongodb://{user}:{urllib.parse.quote(pwd, safe='')}@{host}/{db}?authSource={db}"
print("uri_length", len(uri))
print("uri_user", user)
print("uri_hosts", host)
print("uri_database", db)
print("uri_authSource", db)
patch = {"data": {"ConnectionStrings__MongoDb": base64.b64encode(uri.encode()).decode()}}
path = pathlib.Path("/root/mongo-lockdown/secret.patch")
path.write_text(json.dumps(patch))
path.chmod(0o600)
try:
    subprocess.run(
        ["kubectl", "patch", "secret", "pos-api-secrets", "-n", "pos", "--type", "merge", "--patch-file", str(path)],
        check=True,
    )
finally:
    path.unlink(missing_ok=True)
PY
echo "secret_keys=$(kubectl get secret "$SECRET" -n "$NS" -o go-template='{{range $k, $v := .data}}{{$k}} {{end}}')"
python3 - << 'PY'
import base64, subprocess
from urllib.parse import unquote, parse_qs
raw = subprocess.check_output([
    "kubectl", "get", "secret", "pos-api-secrets", "-n", "pos",
    "-o", "jsonpath={.data.ConnectionStrings__MongoDb}",
], text=True).strip()
uri = base64.b64decode(raw).decode()
scheme, rest = uri.split("://", 1)
userinfo, hostpart = rest.split("@", 1)
user, pw = userinfo.split(":", 1)
path_and_qs = hostpart.split("/", 1)[1]
path, qs = path_and_qs.split("?", 1)
hosts = hostpart.split("/", 1)[0]
q = parse_qs(qs)
print("secret_scheme", scheme)
print("secret_user", unquote(user))
print("secret_password_len", len(pw))
print("secret_hosts", hosts)
print("secret_database_path", path)
print("secret_authSource", q.get("authSource", [""])[0])
print("secret_length", len(uri))
PY

echo "=== variable group ==="
python3 - << 'PY'
import base64, json, os, pathlib, re, urllib.error, urllib.request, urllib.parse
pat = (os.environ.get("ADO_PAT") or "").strip()
token = (os.environ.get("SYSTEM_ACCESSTOKEN") or "").strip()
if pat:
    auth = "Basic " + base64.b64encode(f":{pat}".encode()).decode()
    source = "pat"
elif token:
    auth = "Bearer " + token
    source = "system"
else:
    print("vg_update=no_token")
    pathlib.Path("/root/mongo-lockdown/vg.failed").write_text("1")
    raise SystemExit(0)
pwd = pathlib.Path("/root/mongo-lockdown/pos_app.pass").read_text().strip()
uri = f"mongodb://pos_app:{urllib.parse.quote(pwd, safe='')}@10.244.0.0:27017/pos?authSource=pos"
url = "https://dev.azure.com/CaptainBot/Anchor/_apis/distributedtask/variablegroups/4?api-version=7.1-preview.2"

def call(method, payload=None):
    data = None if payload is None else json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, method=method, headers={
        "Authorization": auth,
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        body = e.read().decode(errors="replace")
        body = re.sub(r"mongodb(\+srv)?://\S+", "mongodb://<redacted>", body, flags=re.I)
        print("vg_http", e.code, "source", source)
        print(body[:300])
        pathlib.Path("/root/mongo-lockdown/vg.failed").write_text("1")
        return None, None

status, group = call("GET")
if group is None:
    print("vg_update=failed")
    raise SystemExit(0)
group["variables"]["MONGO_CONNECTION_STRING"] = {"value": uri, "isSecret": True}
for key in ("createdBy", "modifiedBy", "createdOn", "modifiedOn", "isShared", "description"):
    group.pop(key, None)
status, updated = call("PUT", group)
if updated is None:
    print("vg_update=failed")
    raise SystemExit(0)
val = (updated.get("variables") or {}).get("MONGO_CONNECTION_STRING") or {}
print("vg_update", status, "source", source, "isSecret", val.get("isSecret"), "key", "MONGO_CONNECTION_STRING")
# Never print value; confirm shape only via a follow-up GET that redacts
status2, again = call("GET")
if again:
    stored = (again.get("variables") or {}).get("MONGO_CONNECTION_STRING") or {}
    print("vg_confirm_isSecret", stored.get("isSecret"), "has_value_field", "value" in stored and stored.get("value") is not None)
pathlib.Path("/root/mongo-lockdown/vg.failed").unlink(missing_ok=True)
PY

echo "restart_at_utc=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "restart_at_athens=$(TZ=Europe/Athens date '+%Y-%m-%d %H:%M:%S %Z')"
kubectl rollout restart deployment/"$DEPLOY" -n "$NS"
kubectl rollout status deployment/"$DEPLOY" -n "$NS" --timeout=180s
echo "=== pod after ==="
kubectl get pods -n "$NS" -l app=pos-api -o jsonpath='{range .items[*]}{.metadata.name}{" ip="}{.status.podIP}{" ready="}{.status.containerStatuses[0].ready}{" started="}{.status.startTime}{" restarts="}{.status.containerStatuses[0].restartCount}{"\n"}{end}'
echo

new_ip=$(kubectl get pods -n "$NS" -l app=pos-api -o jsonpath='{.items[0].status.podIP}')
echo "=== health ==="
for url in "http://${new_ip}:5000/api/health" "http://127.0.0.1:31247/api/health" "http://185.193.66.50:31247/api/health"; do
  code=$(curl -sS -m 20 -o "$WORKDIR/health.body" -w "%{http_code}" "$url" || echo curl_fail)
  python3 - "$url" "$code" "$WORKDIR/health.body" << 'PY'
import pathlib, sys
url, code, path = sys.argv[1:]
body = pathlib.Path(path).read_text(errors="replace") if pathlib.Path(path).exists() else ""
if "mongodb://" in body.lower():
    body = "<redacted>"
print(f"health {url} -> {code} {body[:240].replace(chr(10), ' ')}")
PY
done

echo "=== real read ==="
for url in "http://${new_ip}:5000/api/today" "http://127.0.0.1:31247/api/today" "http://185.193.66.50:31247/api/category"; do
  code=$(curl -sS -m 20 -o "$WORKDIR/read.body" -w "%{http_code}" "$url" || echo curl_fail)
  python3 - "$url" "$code" "$WORKDIR/read.body" << 'PY'
import pathlib, sys
url, code, path = sys.argv[1:]
body = pathlib.Path(path).read_text(errors="replace") if pathlib.Path(path).exists() else ""
if "mongodb://" in body.lower():
    body = "<redacted>"
print(f"read {url} -> {code} bytes={len(body)} head={body[:180].replace(chr(10), ' ')}")
PY
done
rm -f "$WORKDIR/health.body" "$WORKDIR/read.body"

echo "=== counts after ==="
mongo_admin "$WORKDIR/counts.js" | tee "$WORKDIR/counts-after.out"
python3 - << 'PY'
from pathlib import Path
before = Path("/root/mongo-lockdown/counts-before.out").read_text().splitlines()
after = Path("/root/mongo-lockdown/counts-after.out").read_text().splitlines()
b = {l.split()[1]: l.split()[2] for l in before if l.startswith("COLL ")}
a = {l.split()[1]: l.split()[2] for l in after if l.startswith("COLL ")}
if b != a:
    print("COUNT_MISMATCH")
    for k in sorted(set(b) | set(a)):
        if b.get(k) != a.get(k):
            print(f"diff {k} before={b.get(k)} after={a.get(k)}")
    raise SystemExit(5)
print("counts_unchanged", len(a))
bs = next((l for l in before if l.startswith("STATS ")), "")
as_ = next((l for l in after if l.startswith("STATS ")), "")
print("stats_before", bs)
print("stats_after", as_)
PY

echo "=== bind after ==="
ss -H -lnt | awk '$4 ~ /:27017$/ {print}'
awk '$1=="bindIp:" || $1=="authorization:" {print}' /etc/mongod.conf

# Confirm we did not touch tradingbot / olive
echo "=== untouched check ==="
kubectl get pods -n tradingbot -l app=tradingbot-backend -o jsonpath='{range .items[*]}{.metadata.name}{" ready="}{.status.containerStatuses[0].ready}{" restarts="}{.status.containerStatuses[0].restartCount}{"\n"}{end}' || true
kubectl get pods -n agrotrack-backend -l app=olive-lifecycle-api -o jsonpath='{range .items[*]}{.metadata.name}{" ready="}{.status.containerStatuses[0].ready}{" restarts="}{.status.containerStatuses[0].restartCount}{"\n"}{end}' || true

rm -f "$WORKDIR/check-user.js" "$WORKDIR/check-user.out" "$WORKDIR/counts.js" "$WORKDIR/create-user.js" "$WORKDIR/verify-app.js" "$WORKDIR/counts-before.out" "$WORKDIR/counts-after.out"
if [ -f "$WORKDIR/vg.failed" ]; then
  echo "apply_done_vg_failed"
  exit 4
fi
echo "apply_done"
