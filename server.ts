import { Hono } from "hono";
import { serve } from "@hono/node-server";
import pg from "pg";

const app = new Hono();

const postgresql = new pg.Pool({
  user: "postgres",
  password: "password",
  host: "localhost",
  port: 5432,
  database: "postgres",
});

app.get("/api/grunnskoler", async (c) => {
  const result = await postgresql.query(`
    select
      s.skolenavn,
      s.eierforhold,
      s.antallelever,
      s.posisjon::json as geometry
    from grunnskoler_d3dd22a6be80438d9f44b0afa9b82b1b.grunnskole s
    inner join fylker_a60155918c4a47c2b78f4ab52fc2bfa4.fylke f
      on st_contains(f.omrade, s.posisjon)
    inner join fylker_a60155918c4a47c2b78f4ab52fc2bfa4.administrativenhetnavn a
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
