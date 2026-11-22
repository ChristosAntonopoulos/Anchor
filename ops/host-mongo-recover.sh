#!/bin/bash
# ANC-41 follow-up (SAFE): disable AutoSeed, mongodump CURRENT pos, inventory backups.
# NEVER drop/restore/overwrite pos in this script.
set -euo pipefail
set +x
umask 077

if [ "$(id -un)" != "root" ]; then
  echo "STOP must run as root"
  exit 3
fi

export KUBECONFIG="${KUBECONFIG:-/etc/kubernetes/admin.conf}"
WORKDIR=/root/mongo-lockdown
ADMIN_FILE=/root/mongo-lockdown/admin.pass
NS=pos
DEPLOY=pos-api
DUMP_DIR="/root/mongo-lockdown/pos-post-wipe-dump-$(date -u +%Y%m%dT%H%M%SZ)"

echo "when=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "athens=$(TZ=Europe/Athens date '+%Y-%m-%d %H:%M:%S %Z')"
echo "mode=SAFE_NO_RESTORE"

if [ ! -r "$ADMIN_FILE" ]; then
  echo "STOP admin password file missing"
  exit 3
fi

echo "=== 1) disable AutoSeedOnStartup (no wipe on next restart) ==="
# Set env on deployment so pods pick it up on next recreate; also patch running if possible.
kubectl set env deployment/"$DEPLOY" -n "$NS" Database__AutoSeedOnStartup=false
# Confirm env present on deployment (value only — safe to print)
kubectl get deploy "$DEPLOY" -n "$NS" -o jsonpath='{range .spec.template.spec.containers[0].env[*]}{.name}={.value}{"\n"}{end}' | grep -E '^Database__AutoSeedOnStartup=' || echo "autoseed_env_missing"
# Scale strategy: keep service up but ensure env is applied via rollout restart ONLY after dump.
# Do NOT scale to 0 unless env patch failed — prefer keeping API up with autoseed off.
echo "autoseed_set=false"

echo "=== 2) current pos counts (before dump) ==="
cat > "$WORKDIR/counts-now.js" << 'JS'
const d = db.getSiblingDB("pos");
const st = d.stats();
print("STATS objects=" + st.objects + " collections=" + st.collections + " dataSize=" + st.dataSize);
d.getCollectionNames().sort().forEach(c => {
  print("COLL " + c + " " + d.getCollection(c).estimatedDocumentCount());
});
JS
docker run --rm --network host \
  -v "$ADMIN_FILE":/run/admin.pass:ro \
  -v "$WORKDIR/counts-now.js":/run/job.js:ro \
  mongo:7 \
  bash -lc 'set +x; exec mongosh "mongodb://127.0.0.1:27017/admin" --username tradingbot_admin --password "$(tr -d "\r\n" < /run/admin.pass)" --authenticationDatabase admin --quiet /run/job.js' \
  | tee "$WORKDIR/counts-post-wipe.out"

echo "=== 3) mongodump CURRENT pos (preserve wiped state; no overwrite of DB) ==="
mkdir -p "$DUMP_DIR"
chmod 700 "$DUMP_DIR"
docker run --rm --network host \
  -v "$ADMIN_FILE":/run/admin.pass:ro \
  -v "$DUMP_DIR":/dump \
  mongo:7 \
  bash -lc 'set +x; mongodump --host 127.0.0.1 --port 27017 --username tradingbot_admin --password "$(tr -d "\r\n" < /run/admin.pass)" --authenticationDatabase admin --db pos --out /dump'
echo "dump_dir=$DUMP_DIR"
du -sh "$DUMP_DIR" "$DUMP_DIR/pos" 2>/dev/null || true
find "$DUMP_DIR" -type f | wc -l | awk '{print "dump_files="$1}'
# Write a marker README (no secrets)
cat > "$DUMP_DIR/README.txt" << EOF
ANC-41 post-wipe dump of database pos
Taken: $(date -u +%Y-%m-%dT%H:%M:%SZ)
Purpose: preserve current state before any restore attempt
DO NOT confuse with pre-wipe backup
EOF
chmod 600 "$DUMP_DIR/README.txt"

echo "=== 4) inventory /root/mongo-lockdown (names/sizes only) ==="
ls -la "$WORKDIR" | awk 'NR==1 || $9!="" {print $1, $5, $6, $7, $8, $9}'
echo "--- find archives/dumps ---"
find "$WORKDIR" -maxdepth 3 \( -type f -o -type d \) \( \
  -iname '*backup*' -o -iname '*dump*' -o -iname '*.archive*' -o -iname '*.bson' \
  -o -iname '*.gz' -o -iname '*.tgz' -o -iname '*.tar' -o -iname '*pos*' \
  -o -iname '*mongod*' -o -iname '*snapshot*' \
\) -printf '%y %p %s\n' 2>/dev/null | head -200

echo "=== 5) search host for other pos dumps (paths only) ==="
# Limited search; do not print file contents
for root in /root /var/backups /opt /home /mnt /data; do
  [ -d "$root" ] || continue
  find "$root" -maxdepth 4 \( -iname '*pos*dump*' -o -iname '*pos*.archive*' -o -iname '*mongodump*pos*' -o -path '*/dump/pos/*' -o -path '*/pos/*.bson' \) 2>/dev/null \
    | head -50 | awk '{print "cand "$0}'
done || true

echo "=== 6) mongod data path / snapshots hints ==="
awk '$1=="dbPath:" || $1=="path:" {print}' /etc/mongod.conf 2>/dev/null || true
if [ -r /etc/mongod.conf ]; then
  dbpath=$(awk '$1=="dbPath:" {print $2}' /etc/mongod.conf | head -1)
  echo "dbPath=${dbpath:-unset}"
  if [ -n "${dbpath:-}" ] && [ -d "$dbpath" ]; then
    ls -ld "$dbpath" || true
    # Look for snapshot/backup siblings near dbpath
    find "$(dirname "$dbpath")" -maxdepth 2 \( -iname '*snap*' -o -iname '*backup*' -o -iname '*pos*' \) -printf '%y %p %s\n' 2>/dev/null | head -40 || true
  fi
fi
# LVM / filesystem snapshots (names only)
lvs 2>/dev/null | head -20 || echo "lvs=unavailable"
ls /snapshots /backup /backups 2>/dev/null || true

echo "=== 7) classify lockdown backups for pos usability ==="
python3 - << 'PY'
from pathlib import Path
import os
root = Path("/root/mongo-lockdown")
print("classify_start")
usable_pos = []
tradingbot_only_hints = []
unknown = []
for p in sorted(root.rglob("*")):
    if p.is_dir():
        name = p.name.lower()
        if name == "pos" and any(p.glob("*.bson")):
            usable_pos.append(str(p))
        continue
    if not p.is_file():
        continue
    n = p.name.lower()
    rel = str(p)
    size = p.stat().st_size
    if "pos-post-wipe-dump" in rel:
        print(f"POST_WIPE_DUMP {rel} bytes={size}")
        continue
    if "tradingbot" in n or "trading" in n:
        tradingbot_only_hints.append(f"{rel} bytes={size}")
        continue
    if any(x in n for x in ("pos", "anchor", "personalos", "personal-os")):
        usable_pos.append(f"{rel} bytes={size}")
        continue
    if any(n.endswith(ext) for ext in (".archive", ".archive.gz", ".dump", ".tgz", ".tar", ".tar.gz", ".gz", ".bson")) \
       or "backup" in n or "dump" in n or "mongod" in n:
        unknown.append(f"{rel} bytes={size}")
print("USABLE_POS_CANDIDATES", len(usable_pos))
for x in usable_pos[:50]:
    print("POS_CAND", x)
print("TRADINGBOT_HINTS", len(tradingbot_only_hints))
for x in tradingbot_only_hints[:50]:
    print("TB_HINT", x)
print("UNKNOWN_BACKUPISH", len(unknown))
for x in unknown[:80]:
    print("UNK", x)
if not usable_pos:
    print("VERDICT=NO_USABLE_POS_BACKUP")
else:
    print("VERDICT=POS_CANDIDATES_NEED_HUMAN_CONFIRM")
PY

echo "=== 8) apply AutoSeed=false via rollout (AFTER dump) ==="
# Restart only pos-api so running pods get Database__AutoSeedOnStartup=false.
# Safe now: autoseed disabled on the deployment template.
echo "restart_at_athens=$(TZ=Europe/Athens date '+%Y-%m-%d %H:%M:%S %Z')"
kubectl rollout restart deployment/"$DEPLOY" -n "$NS"
kubectl rollout status deployment/"$DEPLOY" -n "$NS" --timeout=180s
kubectl get pods -n "$NS" -l app=pos-api -o jsonpath='{range .items[*]}{.metadata.name}{" ready="}{.status.containerStatuses[0].ready}{" restarts="}{.status.containerStatuses[0].restartCount}{" ip="}{.status.podIP}{"\n"}{end}'
echo

# Verify env inside pod (name=value only for AutoSeed)
pod=$(kubectl get pods -n "$NS" -l app=pos-api -o jsonpath='{.items[0].metadata.name}')
kubectl exec -n "$NS" "$pod" -- printenv Database__AutoSeedOnStartup || echo "env_in_pod=unset"
kubectl logs -n "$NS" "$pod" --tail=120 | grep -E '[Ss]eed|Deleting|Cleaning|old/invalid|Auto-seed|auto-seed|Database is' || echo "no_seed_lines"

new_ip=$(kubectl get pods -n "$NS" -l app=pos-api -o jsonpath='{.items[0].status.podIP}')
for url in "http://${new_ip}:5000/api/health" "http://127.0.0.1:31247/api/health" "http://185.193.66.50:31247/api/health"; do
  code=$(curl -sS -m 20 -o /tmp/h.body -w "%{http_code}" "$url" || echo fail)
  echo "health $url -> $code $(head -c 160 /tmp/h.body | tr '\n' ' ')"
done

# Confirm counts unchanged by this safe job (should match dump-time counts)
docker run --rm --network host \
  -v "$ADMIN_FILE":/run/admin.pass:ro \
  -v "$WORKDIR/counts-now.js":/run/job.js:ro \
  mongo:7 \
  bash -lc 'set +x; exec mongosh "mongodb://127.0.0.1:27017/admin" --username tradingbot_admin --password "$(tr -d "\r\n" < /run/admin.pass)" --authenticationDatabase admin --quiet /run/job.js' \
  | tee "$WORKDIR/counts-after-safe-restart.out"

python3 - << 'PY'
from pathlib import Path
b = Path("/root/mongo-lockdown/counts-post-wipe.out").read_text().splitlines()
a = Path("/root/mongo-lockdown/counts-after-safe-restart.out").read_text().splitlines()
bc = {l.split()[1]: l.split()[2] for l in b if l.startswith("COLL ")}
ac = {l.split()[1]: l.split()[2] for l in a if l.startswith("COLL ")}
if bc != ac:
    print("COUNT_DRIFT_AFTER_SAFE_RESTART")
    for k in sorted(set(bc)|set(ac)):
        if bc.get(k) != ac.get(k):
            print(f"diff {k} before={bc.get(k)} after={ac.get(k)}")
else:
    print("counts_stable_after_safe_restart", len(ac))
PY

# Guard: we did not touch tradingbot / olive
kubectl get pods -n tradingbot -l app=tradingbot-backend -o jsonpath='{range .items[*]}{.metadata.name}{" ready="}{.status.containerStatuses[0].ready}{" restarts="}{.status.containerStatuses[0].restartCount}{"\n"}{end}' || true

rm -f "$WORKDIR/counts-now.js"
echo "SAFE_JOB_DONE dump_dir=$DUMP_DIR"
echo "RESTORE_PERFORMED=no"
