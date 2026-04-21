#!/bin/sh

nginx &

cd /usr/verio/backend
npm start

wait