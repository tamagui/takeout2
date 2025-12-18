#!/bin/bash
# Performance experiments for Lighthouse testing

DIST_DIR="/Users/n8/takeout3/dist/client"
INDEX_HTML="$DIST_DIR/index.html"
INDEX_BACKUP="$DIST_DIR/index.html.original"

# Ensure backup exists
if [ ! -f "$INDEX_BACKUP" ]; then
  cp "$INDEX_HTML" "$INDEX_BACKUP"
fi

case "$1" in
  "restore")
    echo "Restoring original index.html..."
    cp "$INDEX_BACKUP" "$INDEX_HTML"
    echo "Done. Original restored."
    ;;

  "no-hydration")
    echo "Experiment: Disable React hydration (remove one-entry script)..."
    cp "$INDEX_BACKUP" "$INDEX_HTML"
    # Remove the one-entry script that triggers hydration
    sed -i '' 's|<script type="module" src="/assets/_virtual_one-entry-[^"]*\.js" async=""></script>|<!-- DISABLED: one-entry hydration -->|g' "$INDEX_HTML"
    echo "Done. React hydration disabled."
    echo "Note: Page will render static HTML but not be interactive."
    ;;

  "no-js")
    echo "Experiment: Remove ALL JavaScript..."
    cp "$INDEX_BACKUP" "$INDEX_HTML"
    # Remove all script tags (keep the globalThis one)
    sed -i '' 's|<script type="module" src="[^"]*" async=""></script>||g' "$INDEX_HTML"
    # Also remove modulepreload links
    sed -i '' 's|<link rel="modulepreload" [^>]*/>||g' "$INDEX_HTML"
    echo "Done. All JS removed."
    echo "Note: Page will render static HTML with no JS at all."
    ;;

  "minimal-js")
    echo "Experiment: Keep only essential scripts (setupClient + one-entry)..."
    cp "$INDEX_BACKUP" "$INDEX_HTML"
    # Keep: setupClient, _virtual_one-entry, wrapStyleTags
    # Remove all other async scripts
    sed -i '' 's|<script type="module" src="/assets/index_ssg-[^"]*\.js" async=""></script>||g' "$INDEX_HTML"
    sed -i '' 's|<script type="module" src="/assets/MDXComponents-[^"]*\.js" async=""></script>||g' "$INDEX_HTML"
    sed -i '' 's|<script type="module" src="/assets/HeadInfo-[^"]*\.js" async=""></script>||g' "$INDEX_HTML"
    # Remove most modulepreload (keep first 5)
    echo "Done. Minimal JS kept."
    ;;

  "half-js")
    echo "Experiment: Remove roughly half the JS by removing 30 script tags..."
    cp "$INDEX_BACKUP" "$INDEX_HTML"
    # Remove various component scripts to reduce JS size
    for script in "TooltipSimple" "Headings" "ButtonSimple" "useScreens" "useResponderEvents" \
                  "closeOpenTooltips" "CheckIcon" "useIconProps" "useLinkTo" "router" \
                  "imperative-api" "useNavigation" "NavigationContainerRefContext" "SizableText" \
                  "animationClamped" "Navigator" "usePresence" "userScheme" "withLayoutContext" \
                  "FlagsContext" "ThemeSwitch" "SiteHeader" "authClient" "UserIcon" \
                  "ListItem" "LineShimmer" "useAsyncEffect" "Input" "handleKeyboardEscape" \
                  "shared" "TwitterLogo" "Logo" "LogoIcon" "FileIcon"; do
      sed -i '' "s|<script type=\"module\" src=\"/assets/${script}[^\"]*\.js\" async=\"\"></script>||g" "$INDEX_HTML"
    done
    echo "Done. ~30 scripts removed."
    ;;

  "status")
    echo "Current experiment status:"
    SCRIPT_COUNT=$(grep -o '<script type="module"' "$INDEX_HTML" | wc -l | tr -d ' ')
    echo "  Script tags: $SCRIPT_COUNT"
    PRELOAD_COUNT=$(grep -o 'rel="modulepreload"' "$INDEX_HTML" | wc -l | tr -d ' ')
    echo "  Modulepreload links: $PRELOAD_COUNT"
    if grep -q "DISABLED: one-entry" "$INDEX_HTML"; then
      echo "  Hydration: DISABLED"
    else
      echo "  Hydration: enabled"
    fi
    ;;

  *)
    echo "Usage: $0 <experiment>"
    echo ""
    echo "Experiments:"
    echo "  restore       - Restore original index.html"
    echo "  no-hydration  - Disable React hydration only"
    echo "  no-js         - Remove all JavaScript"
    echo "  minimal-js    - Keep only essential startup scripts"
    echo "  half-js       - Remove ~30 script tags (~half)"
    echo "  status        - Show current state"
    echo ""
    echo "After running an experiment, refresh Lighthouse to measure."
    ;;
esac
