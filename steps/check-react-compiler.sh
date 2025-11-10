#!/bin/bash

# Check for React optimization hooks that should not be used with React Compiler
# React Compiler automatically optimizes code, so useCallback, useMemo, React.memo, and memo are unnecessary

VIOLATIONS_FOUND=0

echo "Checking for React Compiler violations..."

# Search for useCallback
if grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
	--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=output --exclude-dir=.git --exclude-dir=build \
	"useCallback" . >/dev/null 2>&1; then
	echo ""
	echo "❌ Found useCallback usage (not needed with React Compiler):"
	grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
		--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=output --exclude-dir=.git --exclude-dir=build \
		"useCallback" .
	VIOLATIONS_FOUND=1
fi

# Search for useMemo
if grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
	--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=output --exclude-dir=.git --exclude-dir=build \
	"useMemo" . >/dev/null 2>&1; then
	echo ""
	echo "❌ Found useMemo usage (not needed with React Compiler):"
	grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
		--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=output --exclude-dir=.git --exclude-dir=build \
		"useMemo" .
	VIOLATIONS_FOUND=1
fi

# Search for React.memo
if grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
	--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=output --exclude-dir=.git --exclude-dir=build \
	"React\.memo" . >/dev/null 2>&1; then
	echo ""
	echo "❌ Found React.memo usage (not needed with React Compiler):"
	grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
		--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=output --exclude-dir=.git --exclude-dir=build \
		"React\.memo" .
	VIOLATIONS_FOUND=1
fi

# Search for standalone memo (be careful not to catch words like "memory" or "memo" in comments)
# This pattern looks for memo as a function call: memo(
if grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
	--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=output --exclude-dir=.git --exclude-dir=build \
	"[^a-zA-Z]memo(" . >/dev/null 2>&1; then
	echo ""
	echo "❌ Found memo() usage (not needed with React Compiler):"
	grep -rn --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" \
		--exclude-dir=node_modules --exclude-dir=dist --exclude-dir=output --exclude-dir=.git --exclude-dir=build \
		"[^a-zA-Z]memo(" .
	VIOLATIONS_FOUND=1
fi

if [ $VIOLATIONS_FOUND -eq 1 ]; then
	echo ""
	echo "React Compiler handles optimization automatically."
	echo "Remove useCallback, useMemo, React.memo, and memo from your code."
	exit 1
fi

echo "✓ No React Compiler violations found"
exit 0
