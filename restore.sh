#!/bin/bash

## Repo
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -;
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list';

sudo apt-get update;

## Apt install
sudo apt install \
      curl \
      wget \
      build-essential \
      libssl-dev \
      net-tools \
      openjdk-11-jdk \
      openjdk-11-jre \
      lm-sensors \
      terminator \
      transmission \
      mc \
      gparted \
      openconnect \
      audacious \
      google-chrome-stable \
      git \
      htop \
      ffmpeg \
      emacs \
      -y;

git clone git@github.com:0c70pu5/emacs.d.git ~/.emacs.d;

## How to install Docker
#docker https://docs.docker.com/engine/install/ubuntu/

#https://github.com/nvm-sh/nvm#installing-and-updating
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
#nvm use node

#Webpack issue
#https://github.com/guard/listen/wiki/Increasing-the-amount-of-inotify-watchers
#echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p;

sudo snap install webstorm --classic;
sudo snap install vlc;

#Gnome
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-left "[]";
gsettings set org.gnome.desktop.wm.keybindings switch-to-workspace-right "[]";
gsettings set org.gnome.desktop.wm.keybindings switch-input-source "['<Shift>Alt_L']";
gsettings set org.gnome.desktop.wm.keybindings switch-input-source-backward "['<Alt>Shift_L']";
