#!/bin/bash

# Replace @@header@@, @@footer@@ with the content of header.html, footer.html respectively
HEADER=$(tr -d '\n' < header.html | sed -e 's/[\/&]/\\&/g')
#HEADER=$(tr -d '\n' < header.html | sed -e "s/'/'\\\\''/g; 1s/^/'/; \$s/\$/'/")
FOOTER=$(tr -d '\n' < footer.html | sed -e 's/[\/&]/\\&/g')
SIGNATURE=$(tr -d '\n' < signature.html | sed -e 's/[\/&]/\\&/g')

DEST="$PWD/dist"
[ ! -d $DEST ] && mkdir -p $DEST || :

shopt -s nullglob
shopt -s extglob
for f in !(header|footer).html
do
  sed "s/@@header@@/$HEADER/g; s/@@footer@@/$FOOTER/g; s/@@signature@@/$SIGNATURE/g" $f > "$DEST/$f"
done
