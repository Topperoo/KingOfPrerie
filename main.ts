import { serve } from "https://deno.land/std@0.140.0/http/server.ts";

let kv: any = null;
try {
  kv = await Deno.openKv();
  console.log("Using Deno KV storage");
} catch (error) {
  console.log("Deno KV not available, using in-memory storage for development");
  
  const inMemoryStorage = new Map();
  
  kv = {
    set: async (key: string[], value: any) => {
      inMemoryStorage.set(JSON.stringify(key), value);
      return { ok: true };
    },
    get: async (key: string[]) => {
      const value = inMemoryStorage.get(JSON.stringify(key));
      return { value };
    },
    list: async (options: { prefix: string[] }) => {
      const result = [];
      const prefixStr = JSON.stringify(options.prefix);
      
      for (const [key, value] of inMemoryStorage.entries()) {
        if (key.startsWith(prefixStr.slice(0, -1))) {
          result.push({ key, value });
        }
      }
      
      return {
        [Symbol.asyncIterator]: async function* () {
          for (const entry of result) {
            yield entry;
          }
        }
      };
    }
  };
}

async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  
  if (url.pathname === "/" || url.pathname === "/index.html") {
    try {
      const content = await Deno.readTextFile("./index.html");
      return new Response(content, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    } catch (error) {
      console.error("Error reading index.html:", error);
      return new Response("Error loading HTML", { status: 500 });
    }
  }
  
  if (url.pathname === "/game.js") {
    try {
      const content = await Deno.readTextFile("./game.js");
      return new Response(content, {
        headers: { "content-type": "application/javascript" },
      });
    } catch (error) {
      console.error("Error reading game.js:", error);
      return new Response("Error loading JavaScript", { status: 500 });
    }
  }
  
  if (url.pathname === "/style.css") {
    try {
      const content = await Deno.readTextFile("./style.css");
      return new Response(content, {
        headers: { "content-type": "text/css" },
      });
    } catch (error) {
      console.error("Error reading style.css:", error);
      return new Response("Error loading CSS", { status: 500 });
    }
  }
  
  if (url.pathname.startsWith("/images/")) {
    try {
      const imagePath = "." + url.pathname;
      const imageContent = await Deno.readFile(imagePath);
      let contentType = "image/png";
      if (imagePath.endsWith(".jpg") || imagePath.endsWith(".jpeg")) {
        contentType = "image/jpeg";
      } else if (imagePath.endsWith(".gif")) {
        contentType = "image/gif";
      }
      return new Response(imageContent, {
        headers: { "content-type": contentType },
      });
    } catch (error) {
      console.error("Error reading image:", error);
      return new Response("Image not found", { status: 404 });
    }
  }
  
  if (url.pathname === "/api/scores" && req.method === "POST") {
    try {
      const data = await req.json();
      
      if (!data.name || typeof data.score !== "number" || data.score < 0) {
        return new Response(JSON.stringify({ error: "Invalid data" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      
      const timestamp = new Date().toISOString();
      const key = ["score", timestamp];
      
      await kv.set(key, {
        name: data.name,
        score: data.score,
        monstersKilled: data.monstersKilled || 0,
        potionsCollected: data.potionsCollected || 0,
        survivalTime: data.survivalTime || 0,
        timestamp: timestamp,
      });
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { "content-type": "application/json" },
      });
    } catch (e) {
      console.error("Error saving score:", e);
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }
  
  if (url.pathname === "/api/scores" && req.method === "GET") {
    try {
      const limit = Number(url.searchParams.get("limit")) || 10;
      const scores: Array<{name: string, score: number, timestamp: string}> = [];
      
      for await (const entry of kv.list({ prefix: ["score"] })) {
        scores.push(entry.value as {name: string, score: number, timestamp: string});
      }
      
      scores.sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
      
      const limitedScores = scores.slice(0, limit);
      
      return new Response(JSON.stringify(limitedScores), {
        headers: { "content-type": "application/json" },
      });
    } catch (e) {
      console.error("Error fetching scores:", e);
      return new Response(JSON.stringify({ error: String(e) }), {
        status: 500,
        headers: { "content-type": "application/json" },
      });
    }
  }
  
  return new Response("Not Found", { status: 404 });
}

const port = 8000;
console.log(`Listening on http://localhost:${port}`);
serve(handler, { port });
