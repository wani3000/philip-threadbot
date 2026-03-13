import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to import content."
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

const filePath = new URL("../docs/philip-content-seed.json", import.meta.url);
const rawText = await readFile(filePath, "utf8");
const items = JSON.parse(rawText);

const { data: existingRows, error: existingError } = await supabase
  .from("philip_profiles")
  .select("title");

if (existingError) {
  throw existingError;
}

const existingTitles = new Set((existingRows ?? []).map((row) => row.title));
const rowsToInsert = items
  .filter((item) => !existingTitles.has(item.title))
  .map((item) => ({
    category: item.category,
    title: item.title,
    content: item.content,
    tags: item.tags,
    priority: item.priority,
    is_active: item.isActive,
    used_count: 0
  }));

if (rowsToInsert.length === 0) {
  console.log(
    JSON.stringify(
      {
        inserted: 0,
        skipped: items.length,
        message: "No new content rows to import."
      },
      null,
      2
    )
  );
  process.exit(0);
}

const { data, error } = await supabase
  .from("philip_profiles")
  .insert(rowsToInsert)
  .select("id,title,category");

if (error) {
  throw error;
}

console.log(
  JSON.stringify(
    {
      inserted: data?.length ?? rowsToInsert.length,
      skipped: items.length - rowsToInsert.length,
      titles: data?.map((row) => row.title) ?? []
    },
    null,
    2
  )
);
