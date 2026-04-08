"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/retry/lib/retry_operation.js
var require_retry_operation = __commonJS({
  "node_modules/retry/lib/retry_operation.js"(exports2, module2) {
    function RetryOperation(timeouts, options) {
      if (typeof options === "boolean") {
        options = { forever: options };
      }
      this._originalTimeouts = JSON.parse(JSON.stringify(timeouts));
      this._timeouts = timeouts;
      this._options = options || {};
      this._maxRetryTime = options && options.maxRetryTime || Infinity;
      this._fn = null;
      this._errors = [];
      this._attempts = 1;
      this._operationTimeout = null;
      this._operationTimeoutCb = null;
      this._timeout = null;
      this._operationStart = null;
      this._timer = null;
      if (this._options.forever) {
        this._cachedTimeouts = this._timeouts.slice(0);
      }
    }
    module2.exports = RetryOperation;
    RetryOperation.prototype.reset = function() {
      this._attempts = 1;
      this._timeouts = this._originalTimeouts.slice(0);
    };
    RetryOperation.prototype.stop = function() {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      if (this._timer) {
        clearTimeout(this._timer);
      }
      this._timeouts = [];
      this._cachedTimeouts = null;
    };
    RetryOperation.prototype.retry = function(err) {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      if (!err) {
        return false;
      }
      var currentTime = (/* @__PURE__ */ new Date()).getTime();
      if (err && currentTime - this._operationStart >= this._maxRetryTime) {
        this._errors.push(err);
        this._errors.unshift(new Error("RetryOperation timeout occurred"));
        return false;
      }
      this._errors.push(err);
      var timeout = this._timeouts.shift();
      if (timeout === void 0) {
        if (this._cachedTimeouts) {
          this._errors.splice(0, this._errors.length - 1);
          timeout = this._cachedTimeouts.slice(-1);
        } else {
          return false;
        }
      }
      var self = this;
      this._timer = setTimeout(function() {
        self._attempts++;
        if (self._operationTimeoutCb) {
          self._timeout = setTimeout(function() {
            self._operationTimeoutCb(self._attempts);
          }, self._operationTimeout);
          if (self._options.unref) {
            self._timeout.unref();
          }
        }
        self._fn(self._attempts);
      }, timeout);
      if (this._options.unref) {
        this._timer.unref();
      }
      return true;
    };
    RetryOperation.prototype.attempt = function(fn, timeoutOps) {
      this._fn = fn;
      if (timeoutOps) {
        if (timeoutOps.timeout) {
          this._operationTimeout = timeoutOps.timeout;
        }
        if (timeoutOps.cb) {
          this._operationTimeoutCb = timeoutOps.cb;
        }
      }
      var self = this;
      if (this._operationTimeoutCb) {
        this._timeout = setTimeout(function() {
          self._operationTimeoutCb();
        }, self._operationTimeout);
      }
      this._operationStart = (/* @__PURE__ */ new Date()).getTime();
      this._fn(this._attempts);
    };
    RetryOperation.prototype.try = function(fn) {
      console.log("Using RetryOperation.try() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = function(fn) {
      console.log("Using RetryOperation.start() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = RetryOperation.prototype.try;
    RetryOperation.prototype.errors = function() {
      return this._errors;
    };
    RetryOperation.prototype.attempts = function() {
      return this._attempts;
    };
    RetryOperation.prototype.mainError = function() {
      if (this._errors.length === 0) {
        return null;
      }
      var counts = {};
      var mainError = null;
      var mainErrorCount = 0;
      for (var i = 0; i < this._errors.length; i++) {
        var error = this._errors[i];
        var message = error.message;
        var count = (counts[message] || 0) + 1;
        counts[message] = count;
        if (count >= mainErrorCount) {
          mainError = error;
          mainErrorCount = count;
        }
      }
      return mainError;
    };
  }
});

// node_modules/retry/lib/retry.js
var require_retry = __commonJS({
  "node_modules/retry/lib/retry.js"(exports2) {
    var RetryOperation = require_retry_operation();
    exports2.operation = function(options) {
      var timeouts = exports2.timeouts(options);
      return new RetryOperation(timeouts, {
        forever: options && (options.forever || options.retries === Infinity),
        unref: options && options.unref,
        maxRetryTime: options && options.maxRetryTime
      });
    };
    exports2.timeouts = function(options) {
      if (options instanceof Array) {
        return [].concat(options);
      }
      var opts = {
        retries: 10,
        factor: 2,
        minTimeout: 1 * 1e3,
        maxTimeout: Infinity,
        randomize: false
      };
      for (var key in options) {
        opts[key] = options[key];
      }
      if (opts.minTimeout > opts.maxTimeout) {
        throw new Error("minTimeout is greater than maxTimeout");
      }
      var timeouts = [];
      for (var i = 0; i < opts.retries; i++) {
        timeouts.push(this.createTimeout(i, opts));
      }
      if (options && options.forever && !timeouts.length) {
        timeouts.push(this.createTimeout(i, opts));
      }
      timeouts.sort(function(a, b) {
        return a - b;
      });
      return timeouts;
    };
    exports2.createTimeout = function(attempt, opts) {
      var random = opts.randomize ? Math.random() + 1 : 1;
      var timeout = Math.round(random * Math.max(opts.minTimeout, 1) * Math.pow(opts.factor, attempt));
      timeout = Math.min(timeout, opts.maxTimeout);
      return timeout;
    };
    exports2.wrap = function(obj, options, methods) {
      if (options instanceof Array) {
        methods = options;
        options = null;
      }
      if (!methods) {
        methods = [];
        for (var key in obj) {
          if (typeof obj[key] === "function") {
            methods.push(key);
          }
        }
      }
      for (var i = 0; i < methods.length; i++) {
        var method = methods[i];
        var original = obj[method];
        obj[method] = function retryWrapper(original2) {
          var op = exports2.operation(options);
          var args = Array.prototype.slice.call(arguments, 1);
          var callback = args.pop();
          args.push(function(err) {
            if (op.retry(err)) {
              return;
            }
            if (err) {
              arguments[0] = op.mainError();
            }
            callback.apply(this, arguments);
          });
          op.attempt(function() {
            original2.apply(obj, args);
          });
        }.bind(obj, original);
        obj[method].options = options;
      }
    };
  }
});

// node_modules/retry/index.js
var require_retry2 = __commonJS({
  "node_modules/retry/index.js"(exports2, module2) {
    module2.exports = require_retry();
  }
});

// node_modules/async-retry/lib/index.js
var require_lib = __commonJS({
  "node_modules/async-retry/lib/index.js"(exports2, module2) {
    var retrier = require_retry2();
    function retry2(fn, opts) {
      function run(resolve, reject) {
        var options = opts || {};
        var op;
        if (!("randomize" in options)) {
          options.randomize = true;
        }
        op = retrier.operation(options);
        function bail(err) {
          reject(err || new Error("Aborted"));
        }
        function onError(err, num) {
          if (err.bail) {
            bail(err);
            return;
          }
          if (!op.retry(err)) {
            reject(op.mainError());
          } else if (options.onRetry) {
            options.onRetry(err, num);
          }
        }
        function runAttempt(num) {
          var val;
          try {
            val = fn(bail, num);
          } catch (err) {
            onError(err, num);
            return;
          }
          Promise.resolve(val).then(resolve).catch(function catchIt(err) {
            onError(err, num);
          });
        }
        op.attempt(runAttempt);
      }
      return new Promise(run);
    }
    module2.exports = retry2;
  }
});

// news-feed-refresh.ts
var news_feed_refresh_exports = {};
__export(news_feed_refresh_exports, {
  handler: () => handler
});
module.exports = __toCommonJS(news_feed_refresh_exports);
var import_async_retry = __toESM(require_lib());
var SERPER_API_KEY = process.env.SERPER_API_KEY;
var BLOB_READ_WRITE_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
var EDGE_CONFIG_ID = process.env.EDGE_CONFIG_ID;
var VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN;
var FETCH_TIMEOUTS = {
  SERPER: 1e4,
  YOUTUBE: 15e3,
  SPOTIFY: 2e4
};
var ALL_SPOTIFY_SHOW_IDS = [
  // Bill Simmons Universe (5)
  "07SjDmKb9iliEzpNcN2xGD",
  // The Bill Simmons Podcast
  "1lUPomulZRPquVAOOd56EW",
  // The Rewatchables
  "6mTel3azvnK8isLs4VujvF",
  // The Big Picture
  "3IcA76e8ZV0NNSJ81XHQUg",
  // The Watch
  "4hI3rQ4C0e15rP3YKLKPut",
  // Higher Learning
  // History (8)
  "7Cvsbcjhtur7nplC148TWy",
  // The Rest is History
  "4Zkj8TTa7XAZYI6aFetlec",
  // Stuff You Missed in History Class
  "3Lk9LufHHM9AzVoyYvcI7R",
  // Our Fake History
  "2ejvdShhn5D9tlVbb5vj9B",
  // Behind the Bastards
  "05lvdf9T77KE6y4gyMGEsD",
  // Revolutions
  "3iCqE2fH3ETuXx67BWqFPV",
  // Stuff You Didn't Know About
  "34RuD4w8IVNm49Ge9qzjwT",
  // Cabinet of Curiosities
  "6Z0jGDQp46d69cja0EUFQe",
  // The Bugle
  // Science (8)
  "1mNsuXfG95Lf76YQeVMuo1",
  // StarTalk Radio
  "5nvRkVMH58SelKZYZFZx1S",
  // Ologies
  "2hmkzUtix0qTqvtpPcMzEL",
  // Radiolab
  "2rTT1klKUoQNuaW2Ah19Pa",
  // Short Wave
  "6Ijz5uEUxN6FvJI49ZGJAJ",
  // The Infinite Monkey Cage
  "0QCiNINmwgA6X4Z4nlnh5G",
  // Sawbones
  "5lY4b5PGOvMuOYOjOVEcb9",
  // Science Vs
  "0ofXAdFIQQRsCYj9754UFx",
  // Stuff You Should Know
  // Culture & Analysis (7)
  "2VRS1IJCTn2Nlkg33ZVfkM",
  // 99% Invisible
  "4ZTHlQzCm7ipnRn1ypnl1Z",
  // The New Yorker Radio Hour
  "08F60fHBihlcqWZTr7Thzc",
  // On Being
  "1vfOw64nKjQ8LzZDPCfRaO",
  // TED Radio Hour
  "1sgWaKtQxwfjUpZnnK8r7J",
  // Switched On Pop
  "6XKe8xy5P16OLrkBW9oz0k",
  // Articles of Interest
  "08F60fHBihlcqWZTr7Thzc",
  // The Ezra Klein Show
  // International & Depth (2)
  "6Mwp0XM22DGXDva9SE3J8x",
  // Kerning Cultures
  "269rqhbJIyaCbIzEI4BzCz"
  // Unexplained
];
async function fetchWithTimeout(url, options) {
  const { timeoutMs, label = "request", ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    console.warn(`[fetchWithTimeout] Timeout (${timeoutMs}ms) for ${label}`);
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Timeout (${timeoutMs}ms) for ${label}`);
    }
    throw error;
  }
}
async function withRetry(fn, label, retries = 3) {
  return (0, import_async_retry.default)(async (bail) => {
    try {
      return await fn();
    } catch (error) {
      if (error instanceof Error) {
        console.warn(`[retry] ${label} failed: ${error.message}`);
      }
      throw error;
    }
  }, {
    retries,
    minTimeout: 500,
    maxTimeout: 2e3,
    onRetry: (err, attempt) => {
      console.log(`[retry] ${label} attempt ${attempt} after: ${err.message}`);
    }
  });
}
async function serperSearch(query, boost) {
  if (!SERPER_API_KEY) {
    console.warn("[serperSearch] No SERPER_API_KEY provided");
    return [];
  }
  return withRetry(async () => {
    const res = await fetchWithTimeout(`https://google.serper.dev/news`, {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ q: query, num: 10 }),
      timeoutMs: FETCH_TIMEOUTS.SERPER,
      label: `SerperSearch:${query.slice(0, 30)}`
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} for "${query}"`);
    }
    const data = await res.json();
    const rows = data.news || [];
    return rows.map((row) => ({
      title: row.title,
      url: row.link,
      source: row.source || "Web",
      publishedAt: row.date || (/* @__PURE__ */ new Date()).toISOString(),
      type: "text",
      score: boost,
      slot: "news"
    })).filter((item) => item.title && item.url);
  }, `SerperSearch:${query.slice(0, 30)}`).catch((error) => {
    console.error(`[serperSearch] Failed after retries for query "${query}":`, error);
    return [];
  });
}
async function fetchSpotifyEpisodes() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret || ALL_SPOTIFY_SHOW_IDS.length === 0) {
    console.warn("[fetchSpotifyEpisodes] Missing Spotify credentials or show IDs");
    return null;
  }
  return withRetry(async () => {
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
    const authRes = await fetchWithTimeout("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: "grant_type=client_credentials",
      timeoutMs: FETCH_TIMEOUTS.SPOTIFY,
      label: "SpotifyAuth"
    });
    if (!authRes.ok) {
      throw new Error(`Spotify auth failed: ${authRes.statusText}`);
    }
    const { access_token } = await authRes.json();
    const allEpisodes = [];
    for (const showId of ALL_SPOTIFY_SHOW_IDS) {
      try {
        const episodeRes = await fetchWithTimeout(
          `https://api.spotify.com/v1/shows/${showId}/episodes?limit=1`,
          {
            headers: { "Authorization": `Bearer ${access_token}` },
            timeoutMs: FETCH_TIMEOUTS.SPOTIFY,
            label: `SpotifyEpisodes:${showId}`
          }
        );
        if (!episodeRes.ok)
          continue;
        const data = await episodeRes.json();
        if (data.items?.[0]) {
          const ep = data.items[0];
          const publishDate = new Date(ep.release_date || (/* @__PURE__ */ new Date()).toISOString());
          allEpisodes.push({
            title: ep.name,
            url: ep.external_urls?.spotify || "",
            source: ep.show?.name || "Spotify",
            publishedAt: publishDate.toISOString(),
            type: "audio",
            spotifyId: ep.id,
            thumbnailUrl: ep.images?.[0]?.url || "",
            showId,
            showName: ep.show?.name || "Unknown",
            publishDate
          });
        }
      } catch (err) {
        console.warn(`[fetchSpotifyEpisodes] Failed for show ${showId}:`, err);
        continue;
      }
    }
    if (allEpisodes.length === 0) {
      throw new Error("No Spotify episodes found");
    }
    const now = /* @__PURE__ */ new Date();
    const episodeScores = allEpisodes.map((ep) => {
      const ageMs = now.getTime() - ep.publishDate.getTime();
      const ageDays = ageMs / (1e3 * 60 * 60 * 24);
      const freshnessScore = ageDays < 7 ? 100 : Math.max(0, 100 - ageDays * 2);
      return {
        ...ep,
        freshnessScore,
        totalScore: freshnessScore
      };
    });
    const curated = episodeScores.sort((a, b) => b.totalScore - a.totalScore).slice(0, 8).map(({ freshnessScore, totalScore, showId, showName, publishDate, ...ep }) => ep);
    console.log(`[fetchSpotifyEpisodes] Curated 8 from ${allEpisodes.length} episodes`);
    return {
      title: "Audio Dispatch",
      url: "https://open.spotify.com",
      source: "Spotify",
      publishedAt: curated[0]?.publishedAt || (/* @__PURE__ */ new Date()).toISOString(),
      type: "series",
      score: 1e3,
      slot: "audio_dispatch",
      episodes: curated
    };
  }, "SpotifyEpisodes", 2).catch((error) => {
    console.warn("[fetchSpotifyEpisodes] Failed after retries:", error);
    return null;
  });
}
async function fetchYoutubeVideos(channelId, limit = 3) {
  if (!process.env.YOUTUBE_API_KEY)
    return [];
  return withRetry(async () => {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&order=date&maxResults=${limit}&key=${process.env.YOUTUBE_API_KEY}&type=video`;
    const response = await fetchWithTimeout(url, {
      timeoutMs: FETCH_TIMEOUTS.YOUTUBE,
      label: `YouTubeChannel:${channelId}`
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} for channel ${channelId}`);
    }
    const data = await response.json();
    return (data.items || []).map((item) => ({
      title: item.snippet.title,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      source: "YouTube",
      publishedAt: item.snippet.publishedAt,
      type: "video",
      videoId: item.id.videoId,
      thumbnailUrl: item.snippet.thumbnails.high?.url || ""
    })).slice(0, limit);
  }, `YouTubeChannel:${channelId}`, 2).catch((error) => {
    console.warn(`[fetchYoutubeVideos] Failed after retries for channel ${channelId}:`, error);
    return [];
  });
}
async function buildNewsFeed() {
  const finalItems = [];
  console.log("[buildNewsFeed] Fetching featured series...");
  const starTalkVideos = await fetchYoutubeVideos("UCfV36TX5AejfAGIBtwTc8Zw", 3);
  if (starTalkVideos.length > 0) {
    finalItems.push({
      title: "StarTalk",
      url: "https://www.youtube.com/@StarTalk/videos",
      source: "YouTube",
      publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      type: "series",
      score: 1e3,
      slot: "science_pin",
      episodes: starTalkVideos
    });
  }
  const pbsVideos = await fetchYoutubeVideos("UCxmkLd4JfSQNEtQ05ngeB3A", 3);
  if (pbsVideos.length > 0) {
    finalItems.push({
      title: "PBS Space Time",
      url: "https://www.youtube.com/@pbsspacetime/videos",
      source: "YouTube",
      publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      type: "series",
      score: 1e3,
      slot: "science_pin",
      episodes: pbsVideos
    });
  }
  const grabBagChannels = [
    { id: "UCJic7bfKsKA-IYM_zXC-7vQ", name: "Kurzgesagt" },
    { id: "UCO0jGfsQ35gPCYAspkEKDOA", name: "NOVA PBS Official" }
  ];
  const grabBagVideos = [];
  for (const channel of grabBagChannels) {
    const videos = await fetchYoutubeVideos(channel.id, 4);
    grabBagVideos.push(...videos);
  }
  if (grabBagVideos.length > 0) {
    finalItems.push({
      title: "Grab Bag",
      url: "https://www.youtube.com/",
      source: "YouTube",
      publishedAt: (/* @__PURE__ */ new Date()).toISOString(),
      type: "series",
      score: 1e3,
      slot: "grab_bag",
      episodes: grabBagVideos.slice(0, 8)
    });
  }
  console.log("[buildNewsFeed] Fetching Spotify episodes...");
  const spotify = await fetchSpotifyEpisodes();
  if (spotify) {
    finalItems.push(spotify);
  }
  console.log("[buildNewsFeed] Fetching news articles...");
  const newsPool = [];
  const queries = [
    { query: "Atlanta news WSB", boost: 80 },
    { query: "Georgia local news", boost: 75 },
    { query: "CNN breaking news", boost: 65 },
    { query: "Atlanta business", boost: 60 },
    { query: "Georgia politics", boost: 58 },
    { query: "Atlanta legal news", boost: 55 }
  ];
  for (const { query, boost } of queries) {
    const results = await serperSearch(query, boost);
    newsPool.push(...results);
  }
  const seen = /* @__PURE__ */ new Set();
  seen.add("https://www.youtube.com");
  seen.add("https://open.spotify.com");
  for (const item of finalItems) {
    seen.add(item.url);
  }
  for (const item of newsPool.sort((a, b) => b.score - a.score)) {
    if (finalItems.length >= 20)
      break;
    if (seen.has(item.url))
      continue;
    seen.add(item.url);
    finalItems.push(item);
  }
  console.log(`[buildNewsFeed] Built feed: ${finalItems.length} items`);
  return finalItems;
}
async function saveToBlob(path, data) {
  if (!BLOB_READ_WRITE_TOKEN) {
    throw new Error("Missing BLOB_READ_WRITE_TOKEN");
  }
  return withRetry(async () => {
    const response = await fetchWithTimeout(`https://blob.vercel-storage.com/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${BLOB_READ_WRITE_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data),
      timeoutMs: 3e4,
      label: "BlobUpload"
    });
    if (!response.ok) {
      throw new Error(`Blob upload failed: ${response.statusText}`);
    }
    const result = await response.json();
    return result.url;
  }, "BlobUpload", 3);
}
async function updateEdgeConfig(key, value) {
  if (!EDGE_CONFIG_ID || !VERCEL_API_TOKEN) {
    throw new Error("Missing Edge Config credentials");
  }
  return withRetry(async () => {
    const response = await fetchWithTimeout(
      `https://api.vercel.com/v1/edge-config/${EDGE_CONFIG_ID}/items`,
      {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${VERCEL_API_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          items: [{ operation: "upsert", key, value }]
        }),
        timeoutMs: 3e4,
        label: "EdgeConfigUpdate"
      }
    );
    if (!response.ok) {
      throw new Error(`Edge Config update failed: ${await response.text()}`);
    }
  }, "EdgeConfigUpdate", 3);
}
async function handler(event) {
  console.log("[news-feed-refresh] Starting AWS Lambda refresh...");
  const startTime = Date.now();
  try {
    console.log("[news-feed-refresh] Building news feed...");
    const items = await buildNewsFeed();
    console.log(`[news-feed-refresh] Built feed with ${items.length} items`);
    if (items.length === 0) {
      throw new Error("Failed to build feed: no items returned");
    }
    const cacheEntry = {
      items,
      cachedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    console.log("[news-feed-refresh] Saving to Vercel Blob...");
    const blobUrl = await saveToBlob("news-feed/backup.json", cacheEntry);
    console.log("[news-feed-refresh] Blob saved:", blobUrl);
    console.log("[news-feed-refresh] Updating Edge Config...");
    await updateEdgeConfig("news_cache_backup", {
      blobUrl,
      cachedAt: cacheEntry.cachedAt,
      count: cacheEntry.items.length,
      source: "lambda-primary"
    });
    const duration = Date.now() - startTime;
    console.log(`[news-feed-refresh] \u2713 Completed successfully in ${duration}ms`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        message: "News feed refresh successful",
        items: items.length,
        duration: `${duration}ms`,
        cachedAt: cacheEntry.cachedAt,
        blobUrl
      })
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[news-feed-refresh] \u2717 Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: error.message,
        duration: `${duration}ms`
      })
    };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  handler
});
