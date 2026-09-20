#!/usr/bin/env node
/**
 * Prepares the sample-product seed for a LIVE database in two parts:
 *
 *   1) Downloads each product photo (1000 x 1000 originals, not thumbnails) into the backend project's upload
 *      folder - the same folder the admin screen saves photos to:
 *        <backend>/src/WAYFEIR.Api/wwwroot/uploads/product-images/
 *      They are part of the backend project, so they are published together with it on your next deploy.
 *
 *   2) Writes seed-products.sql. Run it once against the live database (SSMS, Azure Data Studio or sqlcmd).
 *      It adds the categories and ~60 products (base price, seller price = base + 23%) and one ProductImages row
 *      per product pointing at /uploads/product-images/<file>. It is idempotent: products are matched by SKU
 *      (WF-XX-NNN) and skipped when they already exist, so running it twice does nothing.
 *
 * Usage (Node 18+):
 *   node scripts/seed-products/prepare-seed.mjs
 *   node scripts/seed-products/prepare-seed.mjs --images-dir "D:\path\to\wwwroot\uploads\product-images" --sql-out ./seed-products.sql
 *
 * Options:
 *   --images-dir <dir>   where photos are saved (default: the WAYFEIR.Api wwwroot folder below)
 *   --sql-out <file>     where the SQL is written (default: next to this script)
 *   --force              download photos again even if the file already exists
 *   --rollback           write a test version of the SQL that ROLLS BACK instead of committing
 *   --dry-run            validate the data and print the plan; write nothing
 */
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_IMAGES_DIR = "D:\\Personal\\Backend Service\\WAYFEIR-DotNet10\\src\\WAYFEIR.Api\\wwwroot\\uploads\\product-images";
const URL_PREFIX = "/uploads/product-images/"; // matches what the backend stores in ProductImages.FileUrl
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // the app refuses photos above 5 MB
const MIN_SIDE_PX = 800; // "good quality": the originals are 1000 x 1000
const SELLER_MARKUP = 1.23;
const EXT_BY_TYPE = new Map([
  ["image/webp", "webp"],
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
]);

function readArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith("--")) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = true;
    else {
      out[key] = next;
      i++;
    }
  }
  return out;
}

const args = readArgs(process.argv.slice(2));
const IMAGES_DIR = String(args["images-dir"] ?? DEFAULT_IMAGES_DIR);
const SQL_OUT = String(args["sql-out"] ?? path.join(HERE, "seed-products.sql"));
const FORCE = args.force === true;
const ROLLBACK = args.rollback === true;
const DRY_RUN = args["dry-run"] === true;

const round2 = (n) => Math.round(n * 100) / 100;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const sqlString = (s) => `N'${String(s).replace(/'/g, "''")}'`;
const money = (n) => n.toFixed(2);

// Pixel size of a WebP / PNG / JPEG without extra dependencies, to confirm the photo really is high resolution.
function imageSize(buf, type) {
  try {
    if (type === "image/webp") {
      const kind = buf.toString("ascii", 12, 16);
      if (kind === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
      if (kind === "VP8L") {
        const v = buf.readUInt32LE(21);
        return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1];
      }
      if (kind === "VP8X") return [buf.readUIntLE(24, 3) + 1, buf.readUIntLE(27, 3) + 1];
    }
    if (type === "image/png") return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    if (type === "image/jpeg") {
      let i = 2;
      while (i < buf.length) {
        if (buf[i] !== 0xff) break;
        const marker = buf[i + 1];
        const len = buf.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xc3) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
        i += 2 + len;
      }
    }
  } catch {
    // fall through
  }
  return [0, 0];
}

async function exists(file) {
  try {
    return (await stat(file)).size > 0;
  } catch {
    return false;
  }
}

async function download(url) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase();
      const ext = EXT_BY_TYPE.get(type);
      if (!ext) throw new Error(`unsupported photo type "${type}"`);
      const buffer = Buffer.from(await res.arrayBuffer());
      if (buffer.length === 0) throw new Error("empty photo");
      if (buffer.length > MAX_IMAGE_BYTES) throw new Error(`photo is ${(buffer.length / 1048576).toFixed(1)} MB (max 5 MB)`);
      return { buffer, type, ext };
    } catch (err) {
      last = err;
      await new Promise((r) => setTimeout(r, 700 * attempt));
    }
  }
  throw last;
}

function buildSql(rows) {
  const values = rows
    .map((r) => `    (${sqlString(r.sku)}, ${sqlString(r.name)}, ${sqlString(r.category)}, ${sqlString(r.description)}, ${money(r.basePrice)}, ${money(r.sellerPrice)}, ${sqlString(r.fileUrl)})`)
    .join(",\n");
  const categories = [...new Set(rows.map((r) => r.category))];

  return `-- =====================================================================================================
-- WayFair sample products (${rows.length} products, ${categories.length} categories) - generated by prepare-seed.mjs
--
-- Run ONCE against the live database. Safe to re-run: products are matched by SKU (WF-XX-NNN) and skipped when
-- they already exist; categories are matched by name.
--
-- Photos are NOT stored in the database - each ProductImages row points at /uploads/product-images/<file>, and the
-- files themselves live in WAYFEIR.Api/wwwroot/uploads/product-images/ (published with the backend).
-- Prices: SupplierCost = base price, SellingPrice = seller price = base + 23%.
-- =====================================================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRANSACTION;

DECLARE @now DATETIME2 = SYSUTCDATETIME();

-- 1) Categories (reuse by name; a soft-deleted one with the same name is switched back on).
DECLARE @categories TABLE (Name NVARCHAR(150) PRIMARY KEY);
INSERT INTO @categories (Name) VALUES
${categories.map((c) => `    (${sqlString(c)})`).join(",\n")};

UPDATE c SET c.ActiveFlag = 1, c.UpdatedAtUtc = @now
FROM Categories c JOIN @categories x ON x.Name = c.Name
WHERE c.ActiveFlag = 0;

INSERT INTO Categories (Id, Name, ActiveFlag, CreatedAtUtc)
SELECT NEWID(), x.Name, 1, @now
FROM @categories x
WHERE NOT EXISTS (SELECT 1 FROM Categories c WHERE c.Name = x.Name);

-- 2) The products to add.
DECLARE @seed TABLE (
    Sku         NVARCHAR(64)   NOT NULL PRIMARY KEY,
    Name        NVARCHAR(200)  NOT NULL,
    Category    NVARCHAR(150)  NOT NULL,
    Description NVARCHAR(MAX)  NULL,
    BasePrice   DECIMAL(18, 2) NOT NULL,
    SellerPrice DECIMAL(18, 2) NOT NULL,
    FileUrl     NVARCHAR(MAX)  NOT NULL
);

INSERT INTO @seed (Sku, Name, Category, Description, BasePrice, SellerPrice, FileUrl) VALUES
${values};

-- 3) Products that don't exist yet (matched by SKU).
INSERT INTO Products (Id, CategoryId, Name, Sku, Description, SupplierCost, SellingPrice, StockQuantity, IsAvailable, ActiveFlag, CreatedAtUtc)
SELECT NEWID(), c.Id, s.Name, s.Sku, s.Description, s.BasePrice, s.SellerPrice, 0, 1, 1, @now
FROM @seed s
JOIN Categories c ON c.Name = s.Category
WHERE NOT EXISTS (SELECT 1 FROM Products p WHERE p.Sku = s.Sku);

DECLARE @productsAdded INT = @@ROWCOUNT;

-- 4) One photo row per seeded product (skipped if that exact photo is already linked).
INSERT INTO ProductImages (Id, ProductId, FileUrl, ActiveFlag, CreatedAtUtc)
SELECT NEWID(), p.Id, s.FileUrl, 1, @now
FROM @seed s
JOIN Products p ON p.Sku = s.Sku
WHERE NOT EXISTS (SELECT 1 FROM ProductImages i WHERE i.ProductId = p.Id AND i.FileUrl = s.FileUrl);

DECLARE @photosAdded INT = @@ROWCOUNT;

-- 5) Result.
SELECT @productsAdded AS ProductsAdded,
       ${rows.length} - @productsAdded AS AlreadyExisted,
       @photosAdded AS PhotosLinked;

SELECT c.Name AS Category, COUNT(*) AS Products
FROM Products p JOIN Categories c ON c.Id = p.CategoryId
WHERE p.Sku LIKE 'WF-%'
GROUP BY c.Name ORDER BY c.Name;

${ROLLBACK ? "ROLLBACK TRANSACTION;   -- TEST VERSION: nothing is saved" : "COMMIT TRANSACTION;"}

-- -----------------------------------------------------------------------------------------------------
-- To remove these sample products again (only if no order uses them), run:
--   DELETE FROM ProductImages WHERE ProductId IN (SELECT Id FROM Products WHERE Sku LIKE 'WF-%');
--   DELETE FROM Products WHERE Sku LIKE 'WF-%';
-- -----------------------------------------------------------------------------------------------------
`;
}

async function main() {
  const products = JSON.parse(await readFile(path.join(HERE, "products.json"), "utf8"));

  // Validate the data: unique SKUs, price rule, name/SKU lengths.
  const seen = new Set();
  for (const p of products) {
    if (seen.has(p.sku)) throw new Error(`Duplicate SKU in products.json: ${p.sku}`);
    seen.add(p.sku);
    if (p.sku.length > 64 || p.name.length > 200) throw new Error(`${p.sku}: sku/name too long`);
    if (!(p.basePrice > 0)) throw new Error(`${p.sku}: base price must be greater than 0`);
    if (Math.abs(p.sellerPrice - round2(p.basePrice * SELLER_MARKUP)) > 0.011) throw new Error(`${p.sku}: seller price is not base + 23%`);
  }

  const perCategory = new Map();
  products.forEach((p) => perCategory.set(p.category, (perCategory.get(p.category) ?? 0) + 1));
  console.log(`\n${products.length} products in ${perCategory.size} categories:`);
  for (const [name, count] of perCategory) console.log(`  - ${name}: ${count}`);
  console.log(`\nPhotos folder : ${IMAGES_DIR}`);
  console.log(`SQL output    : ${SQL_OUT}${ROLLBACK ? "   (rollback test version)" : ""}\n`);

  if (DRY_RUN) {
    console.log("Dry run: nothing downloaded or written.");
    return;
  }

  await mkdir(IMAGES_DIR, { recursive: true });

  const rows = [];
  let downloaded = 0;
  let reused = 0;
  const problems = [];
  for (const [i, p] of products.entries()) {
    const tag = `[${String(i + 1).padStart(2)}/${products.length}] ${p.sku}`;
    try {
      // Reuse an earlier download of this product's photo (any extension) unless --force.
      let fileName = null;
      if (!FORCE) {
        for (const ext of new Set(EXT_BY_TYPE.values())) {
          const candidate = `${p.sku.toLowerCase()}_${slug(p.name)}.${ext}`;
          if (await exists(path.join(IMAGES_DIR, candidate))) {
            fileName = candidate;
            break;
          }
        }
      }
      if (fileName) {
        reused++;
        console.log(`${tag}  photo already there  ${fileName}`);
      } else {
        const img = await download(p.image);
        const [w, h] = imageSize(img.buffer, img.type);
        if (Math.min(w, h) < MIN_SIDE_PX) throw new Error(`photo is only ${w}x${h}px (need at least ${MIN_SIDE_PX}px)`);
        fileName = `${p.sku.toLowerCase()}_${slug(p.name)}.${img.ext}`;
        await writeFile(path.join(IMAGES_DIR, fileName), img.buffer);
        downloaded++;
        console.log(`${tag}  saved ${fileName}  ${w}x${h}  ${(img.buffer.length / 1024).toFixed(0)} KB`);
      }
      rows.push({ ...p, fileUrl: `${URL_PREFIX}${fileName}` });
    } catch (err) {
      problems.push(`${p.sku} ${p.name}: ${err.message}`);
      console.log(`${tag}  FAILED  ${err.message}`);
    }
  }

  if (problems.length) {
    console.log(`\n${problems.length} product(s) failed, so the SQL was NOT written (it would point at missing photos):\n  ${problems.join("\n  ")}`);
    console.log("\nCheck your internet connection and run the script again; finished photos are kept.");
    process.exitCode = 1;
    return;
  }

  // UTF-8 with a BOM so SSMS / sqlcmd read the accented characters correctly.
  await writeFile(SQL_OUT, "\uFEFF" + buildSql(rows), "utf8");
  console.log(`\nDone. Photos: ${downloaded} downloaded, ${reused} already present. SQL written to:\n  ${SQL_OUT}`);
  console.log("\nNext: 1) run the SQL on the live database   2) deploy the backend (it now contains the photos)");
}

main().catch((err) => {
  console.error(`\nError: ${err.message}`);
  process.exit(1);
});
