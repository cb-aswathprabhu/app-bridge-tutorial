require("isomorphic-fetch");
const Koa = require("koa");
const path = require("path");
const static = require("koa-static");
const mount = require("koa-mount");
const bodyParser = require('koa-bodyparser');
const Router = require('koa-router');
const router = new Router();
const fetch = require('isomorphic-fetch');

const { default: createShopifyAuth } = require("@shopify/koa-shopify-auth");
const { verifyRequest } = require("@shopify/koa-shopify-auth");
const session = require("koa-session");

const dotenv = require("dotenv");
dotenv.config();

let ACCESS_TOKEN = '';
let SHOP_NAME = '';

const port = parseInt(process.env.PORT, 10) || 3000;

const { SHOPIFY_API_SECRET_KEY, SHOPIFY_API_KEY } = process.env;

buildServer();

async function buildServer() {
  const server = new Koa();
  server.use(session(server));
  server.use(bodyParser());
  server.keys = [SHOPIFY_API_SECRET_KEY];

  server.use(
    createShopifyAuth({
      apiKey: SHOPIFY_API_KEY,
      secret: SHOPIFY_API_SECRET_KEY,
      scopes: ["read_products", "read_orders", "write_products", "write_orders", "read_assigned_fulfillment_orders", "write_assigned_fulfillment_orders", "read_checkouts", "write_checkouts", "read_content", "write_content", "read_customers", "write_customers", "read_discounts", "write_discounts", "read_script_tags", "write_script_tags", "read_themes", "write_themes"],
      afterAuth(ctx) {
        const { shop, accessToken } = ctx.session;
        console.log('After Auth', shop, accessToken);
        ACCESS_TOKEN = accessToken;
        SHOP_NAME = shop;
        ctx.cookies.set("shopOrigin", shop, { httpOnly: false });
        ctx.redirect("/");
      }
    })
  );

  server.use(verifyRequest());
  server
    .use(router.routes())
    .use(router.allowedMethods());

  if (process.env.NODE_ENV === "production") {
    server.use(mount("/", static(__dirname + "/public")));
  } else {
    await webpackMiddleware(server);
  }

  server.listen(port, () => {
    console.log(`> Ready on http://localhost:${port}`);
  });
}

// serve files from webpack, in memory
async function webpackMiddleware(server) {
  const koaWebpack = require("koa-webpack");
  const config = require("./webpack.config.js");

  const middleware = await koaWebpack({
    config,
    hotClient: false
  });
  server.use(middleware);

  // to access in-memory filesystem provided by html-webpack-plugin
  server.use(async ctx => {
    const filename = path.resolve(config.output.path, "index.html");
    ctx.response.type = "html";
    ctx.response.body = middleware.devMiddleware.fileSystem.createReadStream(
      filename
    );
  });
}


router
  .get('/products', async (ctx, next) => {
    console.log('During Call', SHOP_NAME, ACCESS_TOKEN);
    try {
      let response = await fetch(`https://${SHOP_NAME}/admin/api/2021-10/products.json`, {
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': ACCESS_TOKEN
        }
      });
      let data = await response.json();
      ctx.body = data;
    } catch (err) {
      console.log('Errors', error);
    }
  });
