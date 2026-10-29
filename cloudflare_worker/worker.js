/**
 * =========================================================================
 * Cloudflare Worker - Instagram Tracker 智能反向代理与自动寻址中转脚本
 * =========================================================================
 * 
 * 作用：
 * 1. 拦截所有 /api/* 请求，自动反向代理到您电脑最新的 Cloudflare Tunnel 地址
 * 2. 接收本地电脑 run_tunnel.py 发来的心跳上报 (/api/sync_tunnel)，动态更新隧道地址
 * 3. 完美支持全球多地免配直连，即便电脑重启或隧道分配了新随机网址，手机端也永久无感！
 */

// 预设默认回退隧道 (当尚未收到心跳时使用)
const DEFAULT_TUNNEL_FALLBACK = "https://approval-shifty-game.ngrok-free.dev";

// 电脑与 Worker 对暗号的统一密钥 (防他人恶意篡改)
const SYNC_SECRET = "ig_tracker_secret_2026";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // -------------------------------------------------------------
    // 1. 处理 OPTIONS 预检请求 (解决全站跨域问题)
    // -------------------------------------------------------------
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // -------------------------------------------------------------
    // 2. 本地电脑心跳上报通道: POST /api/sync_tunnel
    // -------------------------------------------------------------
    if (url.pathname === "/api/sync_tunnel") {
      if (request.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed. Use POST." }), {
          status: 405,
          headers: { "Content-Type": "application/json" }
        });
      }

      try {
        const body = await request.json();
        if (body.secret !== SYNC_SECRET) {
          return new Response(JSON.stringify({ error: "Invalid sync secret key" }), {
            status: 403,
            headers: { "Content-Type": "application/json" }
          });
        }

        const newTunnelUrl = (body.tunnel_url || "").trim().replace(/\/+$/, "");
        if (!newTunnelUrl.startsWith("http")) {
          return new Response(JSON.stringify({ error: "Invalid tunnel URL" }), {
            status: 400,
            headers: { "Content-Type": "application/json" }
          });
        }

        // 保存到内存
        globalThis.__ACTIVE_TUNNEL_URL = newTunnelUrl;

        // 如果用户绑定了 Cloudflare KV (如 IG_KV)，持久化保存
        if (env && env.IG_KV) {
          await env.IG_KV.put("ACTIVE_TUNNEL_URL", newTunnelUrl);
        }

        return new Response(JSON.stringify({
          success: true,
          message: "🎉 隧道地址已实时更新！",
          active_url: newTunnelUrl,
          has_kv: Boolean(env && env.IG_KV),
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), {
          status: 500,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // -------------------------------------------------------------
    // 3. 状态查询接口: GET /api/tunnel_status
    // -------------------------------------------------------------
    if (url.pathname === "/api/tunnel_status") {
      let currentUrl = globalThis.__ACTIVE_TUNNEL_URL || DEFAULT_TUNNEL_FALLBACK;
      if (env && env.IG_KV) {
        currentUrl = (await env.IG_KV.get("ACTIVE_TUNNEL_URL")) || currentUrl;
      }
      return new Response(JSON.stringify({
        status: "online",
        active_tunnel_url: currentUrl,
        has_kv: Boolean(env && env.IG_KV)
      }), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }

    // -------------------------------------------------------------
    // 4. 反向代理所有爬虫/博主数据 API (/api/*) 转发到电脑上的活跃隧道
    // -------------------------------------------------------------
    if (url.pathname.startsWith("/api/")) {
      let targetOrigin = globalThis.__ACTIVE_TUNNEL_URL || DEFAULT_TUNNEL_FALLBACK;
      if (env && env.IG_KV) {
        targetOrigin = (await env.IG_KV.get("ACTIVE_TUNNEL_URL")) || targetOrigin;
      }
      targetOrigin = targetOrigin.replace(/\/+$/, "");

      const targetUrl = new URL(url.pathname + url.search, targetOrigin);
      const proxyHeaders = new Headers(request.headers);
      proxyHeaders.set("host", new URL(targetOrigin).host);

      try {
        const proxyResponse = await fetch(targetUrl.toString(), {
          method: request.method,
          headers: proxyHeaders,
          body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
          redirect: "follow",
        });

        const responseHeaders = new Headers(proxyResponse.headers);
        responseHeaders.set("Access-Control-Allow-Origin", "*");
        responseHeaders.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        responseHeaders.set("Access-Control-Allow-Headers", "*");

        return new Response(proxyResponse.body, {
          status: proxyResponse.status,
          statusText: proxyResponse.statusText,
          headers: responseHeaders,
        });
      } catch (proxyErr) {
        return new Response(JSON.stringify({
          error: "无法连通电脑本地后端 (Failed to proxy to local tunnel)",
          details: proxyErr.message,
          target_tunnel: targetOrigin,
          hint: "请确认您电脑上的【启动后端与Cloudflare隧道.bat】正在运行"
        }), {
          status: 502,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
    }

    // -------------------------------------------------------------
    // 5. 静态前端网页 (HTML / CSS / JS / 资源文件) 与 SPA 单页路由 Fallback
    // -------------------------------------------------------------
    if (env && env.ASSETS) {
      const response = await env.ASSETS.fetch(request);
      if (response.status === 404 && request.method === "GET") {
        const accept = request.headers.get("Accept") || "";
        // 如果是浏览器访问页面（如 /login, /page/login, /page/profile 等）
        if (accept.includes("text/html") || !url.pathname.includes(".")) {
          const spaRequest = new Request(new URL("/", request.url), request);
          return env.ASSETS.fetch(spaRequest);
        }
      }
      return response;
    }

    return new Response("Not found", { status: 404 });
  }
};
