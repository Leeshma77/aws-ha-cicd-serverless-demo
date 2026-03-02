#!/bin/bash
set -e
source /etc/environment || true
cd /opt/webapp/current/app
pm2 delete combined-app || true
pm2 start server.js --name combined-app --time
pm2 save
