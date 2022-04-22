mkdir tmp

mkdir tmp/linux
cp apps/linux/* tmp/linux/
cp binaries/file_explorer_web-linux tmp/linux

rm -rf builds
mkdir builds
zip -j builds/file_explorer_web-linux.zip tmp/linux/*

rm -rf tmp/
