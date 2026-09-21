#!/bin/sh
set -eu
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
ROOT=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)

if [ -z "${JAVA_HOME:-}" ]; then
    if [ -d "$ROOT/.toolchain/jdk/Contents/Home" ]; then
        export JAVA_HOME="$ROOT/.toolchain/jdk/Contents/Home"
    elif [ -d "/Users/ama/flightscreen/.toolchain/jdk/Contents/Home" ]; then
        export JAVA_HOME="/Users/ama/flightscreen/.toolchain/jdk/Contents/Home"
    fi
fi

if [ -z "${ANDROID_HOME:-}" ] && [ -z "${ANDROID_SDK_ROOT:-}" ]; then
    if [ -d "$ROOT/.toolchain/android-sdk" ]; then
        export ANDROID_HOME="$ROOT/.toolchain/android-sdk"
    elif [ -d "/Users/ama/flightscreen/.toolchain/android-sdk" ]; then
        export ANDROID_HOME="/Users/ama/flightscreen/.toolchain/android-sdk"
    fi
fi

cd "$ROOT"
exec ./gradlew "$@"
