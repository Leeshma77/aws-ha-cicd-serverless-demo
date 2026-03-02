#!/bin/bash
set -e
# Node.js 20 & PM2 on Amazon Linux 2
if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo -E bash -
  sudo yum install -y nodejs
fi
sudo npm install -g pm2

sudo mkdir -p /opt/webapp/current
sudo chown -R ec2-user:ec2-user /opt/webapp

cd /opt/webapp/current/app
npm ci || npm install
