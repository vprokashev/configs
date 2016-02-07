#!/bin/bash
mkdir -p /tmp/adodefont
cd /tmp/adodefont
wget -q --show-progress -O source-code-pro.zip https://github.com/adobe-fonts/source-code-pro/archive/2.030R-ro/1.050R-it.zip
unzip -q source-code-pro.zip -d source-code-pro
mkdir -p /usr/local/share/fonts/
sudo cp -v source-code-pro/*/OTF/*.otf /usr/local/share/fonts/
fc-cache -f
rm -rf source-code-pro{,.zip}
