#!/usr/bin/env bash
# Accept Android SDK licenses and install the NDK/CMake/platforms Expo SDK 54
# / React Native 0.81 need. Gradle configure fails with LicenceNotAcceptedException
# if the agent SDK is missing ndk;27.1.12297006 or the license hash is absent.
set -euo pipefail

NDK_VERSION="${NDK_VERSION:-27.1.12297006}"
CMAKE_VERSION="${CMAKE_VERSION:-3.30.5}"
COMPILE_SDK="${COMPILE_SDK:-36}"
BUILD_TOOLS="${BUILD_TOOLS:-36.0.0}"
CMDLINE_TOOLS_URL="${CMDLINE_TOOLS_URL:-https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip}"

discover_android_home() {
  if [ -n "${ANDROID_HOME:-}" ] && [ -d "$ANDROID_HOME" ]; then
    echo "$ANDROID_HOME"
    return
  fi
  if [ -n "${ANDROID_SDK_ROOT:-}" ] && [ -d "$ANDROID_SDK_ROOT" ]; then
    echo "$ANDROID_SDK_ROOT"
    return
  fi
  local candidate
  for candidate in "$HOME/Android/Sdk" /opt/android-sdk /usr/lib/android-sdk; do
    if [ -d "$candidate" ]; then
      echo "$candidate"
      return
    fi
  done
  if [ -n "${LOCALAPPDATA:-}" ] && [ -d "${LOCALAPPDATA}/Android/Sdk" ]; then
    echo "${LOCALAPPDATA}/Android/Sdk"
    return
  fi
  echo ""
}

find_sdkmanager() {
  local root="$1"
  local candidate
  for candidate in \
    "$root/cmdline-tools/latest/bin/sdkmanager" \
    "$root/cmdline-tools/bin/sdkmanager" \
    "$root/tools/bin/sdkmanager"
  do
    if [ -x "$candidate" ]; then
      echo "$candidate"
      return
    fi
  done
  # Some installs keep a versioned cmdline-tools folder instead of "latest".
  if [ -d "$root/cmdline-tools" ]; then
    candidate="$(find "$root/cmdline-tools" -type f -name sdkmanager 2>/dev/null | head -1 || true)"
    if [ -n "$candidate" ] && [ -x "$candidate" ]; then
      echo "$candidate"
      return
    fi
  fi
  echo ""
}

install_cmdline_tools() {
  local root="$1"
  echo "sdkmanager not found. Installing Android command-line tools into $root"
  local zip="/tmp/android-cmdline-tools.zip"
  local extract="/tmp/android-cmdline-tools"
  curl --retry 4 --retry-delay 4 -fL -o "$zip" "$CMDLINE_TOOLS_URL"
  rm -rf "$extract"
  mkdir -p "$extract"
  unzip -q "$zip" -d "$extract"
  mkdir -p "$root/cmdline-tools/latest"
  if [ -d "$extract/cmdline-tools" ]; then
    cp -a "$extract/cmdline-tools/." "$root/cmdline-tools/latest/"
  else
    echo "ERROR: command-line tools archive did not contain cmdline-tools/"
    ls -la "$extract" || true
    exit 1
  fi
  rm -rf "$extract" "$zip"
  chmod +x "$root/cmdline-tools/latest/bin/sdkmanager" || true
}

write_licenses() {
  local root="$1"
  mkdir -p "$root/licenses"
  # Hashes AGP checks before it will install NDK / platforms. Multiple historical
  # hashes are kept so an older sdkmanager still treats the license as accepted.
  cat > "$root/licenses/android-sdk-license" <<'EOF'
24333f8a63b6825ea9c5514f83c2829b004d1dc9
d56f5187479451eabf01fb78af6dfcb131a6481e
8933bad161af4178b1185d1a37eab41e
EOF
  cat > "$root/licenses/android-sdk-preview-license" <<'EOF'
84831b9409646166c46420b456c5c4eb
504667f4c0de7af1a06de9f4b1727b86
EOF
}

package_installed() {
  local root="$1"
  local spec="$2"
  case "$spec" in
    ndk\;*)
      [ -f "$root/ndk/${spec#ndk;}/source.properties" ]
      ;;
    cmake\;*)
      [ -d "$root/cmake/${spec#cmake;}" ]
      ;;
    platforms\;*)
      [ -d "$root/platforms/${spec#platforms;}" ]
      ;;
    build-tools\;*)
      [ -d "$root/build-tools/${spec#build-tools;}" ]
      ;;
    platform-tools)
      [ -d "$root/platform-tools" ]
      ;;
    *)
      return 1
      ;;
  esac
}

ANDROID_HOME="$(discover_android_home)"
if [ -z "$ANDROID_HOME" ]; then
  echo "ERROR: ANDROID_HOME is not set and no Android SDK was found on this agent."
  echo "Install the Android SDK on the Default pool machine, then rerun."
  exit 1
fi
export ANDROID_HOME
export ANDROID_SDK_ROOT="$ANDROID_HOME"
echo "Using Android SDK at $ANDROID_HOME"

if [ -z "${JAVA_HOME:-}" ] || [ ! -x "${JAVA_HOME}/bin/java" ]; then
  echo "ERROR: JAVA_HOME must point at a JDK before installing Android SDK packages."
  exit 1
fi
export PATH="$JAVA_HOME/bin:$PATH"

if [ ! -w "$ANDROID_HOME" ]; then
  echo "ERROR: Cannot write to $ANDROID_HOME. The agent user must own this SDK to accept licenses and install the NDK."
  ls -ld "$ANDROID_HOME" || true
  exit 1
fi

write_licenses "$ANDROID_HOME"
echo "Wrote Android SDK license hashes under $ANDROID_HOME/licenses"

SDKMANAGER="$(find_sdkmanager "$ANDROID_HOME")"
if [ -z "$SDKMANAGER" ]; then
  install_cmdline_tools "$ANDROID_HOME"
  SDKMANAGER="$(find_sdkmanager "$ANDROID_HOME")"
fi
if [ -z "$SDKMANAGER" ] || [ ! -x "$SDKMANAGER" ]; then
  echo "ERROR: sdkmanager is not available under $ANDROID_HOME"
  ls -la "$ANDROID_HOME" || true
  ls -la "$ANDROID_HOME/cmdline-tools" || true
  exit 1
fi
echo "Using sdkmanager at $SDKMANAGER"

# Avoid `yes |` — SIGPIPE under pipefail fails the step even after licenses are accepted.
printf 'y\ny\ny\ny\ny\ny\ny\ny\ny\ny\n' | "$SDKMANAGER" --sdk_root="$ANDROID_HOME" --licenses >/tmp/android-sdk-licenses.log 2>&1 || true
echo "sdkmanager --licenses finished (see /tmp/android-sdk-licenses.log if a later install fails)"

PACKAGES=(
  "platform-tools"
  "platforms;android-${COMPILE_SDK}"
  "build-tools;${BUILD_TOOLS}"
  "ndk;${NDK_VERSION}"
  "cmake;${CMAKE_VERSION}"
)

TO_INSTALL=()
for spec in "${PACKAGES[@]}"; do
  if package_installed "$ANDROID_HOME" "$spec"; then
    echo "Already installed: $spec"
  else
    TO_INSTALL+=("$spec")
  fi
done

if [ "${#TO_INSTALL[@]}" -gt 0 ]; then
  echo "Installing Android SDK packages: ${TO_INSTALL[*]}"
  "$SDKMANAGER" --sdk_root="$ANDROID_HOME" "${TO_INSTALL[@]}"
else
  echo "Required Android SDK packages are already installed."
fi

NDK_DIR="$ANDROID_HOME/ndk/$NDK_VERSION"
if [ ! -f "$NDK_DIR/source.properties" ]; then
  echo "ERROR: NDK $NDK_VERSION is still missing after sdkmanager install."
  echo "Expected $NDK_DIR/source.properties"
  ls -la "$ANDROID_HOME/ndk" || true
  exit 1
fi
echo "NDK ready at $NDK_DIR"

if [ -n "${BUILD_BUILDID:-}" ]; then
  echo "##vso[task.setvariable variable=ANDROID_HOME]$ANDROID_HOME"
  echo "##vso[task.setvariable variable=ANDROID_SDK_ROOT]$ANDROID_HOME"
  echo "##vso[task.setvariable variable=ANDROID_NDK_HOME]$NDK_DIR"
fi
