import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import pg from "pg";

const app = new Hono();

const postgresql = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://postgres:@localhost",
});
    app.get("/api/grunnskoler", async (c) => {
      try {
        const result = await postgresql.query(`
          select
            skolenavn,
            eierforhold,
            antallelever,
            st_asgeojson(posisjon)::json as geometry
          from grunnskoler_3a006a25a9f7437287ed36c2a7f54c51.grunnskole
          limit 20
        `);

        return c.json({
          type: "FeatureCollection",
          features: result.rows.map(({ geometry, ...properties }) => ({
            type: "Feature",
            properties,
            geometry,
          })),
        });
      } catch (error) {
        console.error("API /api/grunnskoler failed:", error);
        return c.json({ error: String(error) }, 500);
      }
    });

app.use("*", serveStatic({ root: "../dist" }));

serve({
  fetch: app.fetch,
  port: Number(process.env.PORT) || 3000,
});
