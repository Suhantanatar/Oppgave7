import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import pg from "pg";

const app = new Hono();

const postgresql = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL || "postgresql://postgres:@localhost",
});

app.get("/api/grunnskoler", async (c) => {
  const result = await postgresql.query(`
    select
      s.skolenavn,
      s.eierforhold,
      s.antallelever,
      s.posisjon::json as geometry
    from grunnskoler_3a006a25a9f7437287ed36c2a7f54c51.grunnskole s
    inner join fylker_ba7aea2735714391a98b1a585644e98a.fylke f
      on st_contains(f.omrade, s.posisjon)
    inner join fylker_ba7aea2735714391a98b1a585644e98a.administrativenhetnavn a
      on f.lokalid = a.fylke_fk
     and a.sprak = 'nor'
    where a.navn in ('Akershus', 'Buskerud', 'Østfold')
  `);

  return c.json({
    type: "FeatureCollection",
    features: result.rows.map(({ geometry, ...properties }) => ({
      type: "Feature",
      properties,
      geometry,
    })),
  });
});

serve({
  fetch: app.fetch,
  port: 3000,
});
app.use("*", serveStatic({ root: "../dist" }));
