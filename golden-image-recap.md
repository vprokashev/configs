# Debian Testing XFCE Golden Image

## Цель

Подготовить **Golden-образ Debian Testing + XFCE** для:
- экспериментов (AI, toolchains, system-level вещи)
- быстрого восстановления системы
- модели **reimage**, а не rollback

## Способ сборки образа

### 1. Установка debootstrap (в Ubuntu)
```bash
sudo apt update
sudo apt install debootstrap
```

### 2. Создание корня Debian Testing
```bash
sudo mkdir -p /opt/debian-golden
sudo debootstrap testing /opt/debian-golden http://deb.debian.org/debian
```

### 3. Подготовка chroot
```bash
sudo mount --bind /dev      /opt/debian-golden/dev
sudo mount --bind /dev/pts /opt/debian-golden/dev/pts
sudo mount --bind /proc    /opt/debian-golden/proc
sudo mount --bind /sys     /opt/debian-golden/sys
sudo mount --bind /run     /opt/debian-golden/run
```

Вход:
```bash
sudo chroot /opt/debian-golden /bin/bash
```

### 4. Репозитории (Debian Testing)
```bash
cat > /etc/apt/sources.list <<'EOF'
deb http://deb.debian.org/debian testing main contrib non-free non-free-firmware
deb http://security.debian.org/debian-security testing-security main contrib non-free non-free-firmware
EOF

apt update
```

Проверка:
```bash
apt-cache policy libc6
```

### 5. Базовая система
```bash
apt install -y \
  systemd-sysv \
  dbus \
  sudo \
  locales \
  tzdata \
  ca-certificates
```

### 6. Ядро Debian Testing
```bash
apt install -y linux-image-amd64
```

### 7. XFCE (минимальный набор)
```bash
apt install -y \
  xfce4 \
  xfce4-terminal \
  xfce4-session \
  xfce4-settings \
  thunar \
  gvfs \
  gvfs-backends \
  lightdm \
  lightdm-gtk-greeter
```

```bash
systemctl enable lightdm
```

### 8. Сеть и базовые сервисы
```bash
apt install -y \
  network-manager \
  openssh-server
```

```bash
systemctl enable NetworkManager
```

### 9. Пользователь и идентификация
```bash
passwd root
useradd -m -G sudo -s /bin/bash vadim
passwd vadim
```

```bash
echo debian-golden > /etc/hostname
cat > /etc/hosts <<'EOF'
127.0.0.1 localhost
127.0.1.1 debian-golden
EOF
```

### 10. Очистка перед упаковкой
```bash
apt clean
rm -rf /var/cache/apt/*
rm -rf /tmp/*
```

### 11. Выход из chroot и размонтирование
```bash
exit
```
```bash
sudo umount /opt/debian-golden/dev/pts
sudo umount /opt/debian-golden/dev
sudo umount /opt/debian-golden/proc
sudo umount /opt/debian-golden/sys
sudo umount /opt/debian-golden/run
```

### 12. Сборка golden-образа
```bash
sudo tar \
  --numeric-owner \
  --xattrs \
  --acls \
  -cpf - \
  -C /opt/debian-golden . \
| zstd -19 -T0 > debian-testing-xfce-golden.tar.zst
```
