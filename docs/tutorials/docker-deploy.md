# Docker 一键部署

> 用 Docker Compose 一键部署 nowen-note。

---

## 前提

- Linux 服务器（或 macOS/Windows 安装了 Docker）
- Docker 和 Docker Compose 已安装

---

## 部署步骤

### 克隆项目

```bash
git clone https://github.com/cropflre/nowen-note.git
cd nowen-note
```

### 启动

```bash
docker-compose up -d
```

### 访问

浏览器打开 `http://<服务器IP>:3001`

### 登录

用户名：`admin`，密码：`admin123`

> ⚠️ 首次登录后立即修改密码！

---

## 配置

| 变量 | 默认值 | 说明 |
|---|---|---|
| `PORT` | `3001` | 服务端口 |
| `DB_PATH` | `/app/data/nowen-note.db` | 数据库路径 |

数据持久化目录：`./data`

---

## 常用操作

```bash
docker-compose logs -f      # 查看日志
docker-compose restart       # 重启
docker-compose down          # 停止
git pull && docker-compose up -d --build  # 更新
```

---

## 反向代理

Nginx 配置示例：

```nginx
server {
    listen 80;
    server_name note.example.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## 常见问题

### Q：端口被占用？

修改 `docker-compose.yml` 中的端口映射。

### Q：启动后白屏？

`docker-compose logs backend` 查看后端日志。

---

## 下一步

- [NAS 部署教程](./nas-deploy.md)
- [数据备份与迁移](./backup-migrate.md)

---

> 本教程基于 nowen-note v1.1.18 编写。
