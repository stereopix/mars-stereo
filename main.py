#!/usr/bin/env python3

import sys
from aiohttp import web, client
import asyncio

async def http_root_handler(request):
    with open('resources/index.html') as f:
        return web.Response(text=f.read(), content_type='text/html')

async def forward(request, url):
  #print('>', url)
  headers = {'Accept': 'application/vnd.phereo.v3+json'}
  for k in ('Cache-Control', 'If-Modified-Since', 'If-None-Match', 'User-Agent'):
    if k in request.headers:
      headers[k] = request.headers[k]
  async with client.request(
      'GET',
      url,
      headers = headers,
      allow_redirects = False,
      data = await request.read()
  ) as res:
    if res.status == 404:
      raise web.HTTPNotFound()
    elif res.status == 302:
      raise web.HTTPFound(location=res.headers.get('Location'))
    elif res.status == 304:
      raise web.HTTPNotModified()
    elif res.status != 200:
      raise web.HTTPInternalServerError() # Not expected
    headers = {'Access-Control-Allow-Origin': '*'}
    for k in ('Content-Type', 'Expires', 'Cache-Control', 'Pragma', 'ETag', 'Last-Modified'):
      if k in res.headers:
        headers[k] = res.headers[k]
    return web.Response(
      status = 200,
      headers = headers,
      body = await res.read()
    )

@web.middleware
async def error_middleware(request, handler):
    try:
        return await handler(request)
    except web.HTTPNotFound:
        return web.Response(text='404 Not Found', status=404, headers={'Access-Control-Allow-Origin': '*'})

async def start_server(host, port):
    app = web.Application()
    app.add_routes([
      web.get('/', http_root_handler),
      web.static('/', 'resources'),
    ])
    app.middlewares.append(error_middleware)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host, port)
    await site.start()
    print(f'Listening {host}:{port}')

if __name__ == '__main__':
    host = '0.0.0.0'
    port = 8080
    if len(sys.argv) >= 2:
        host = sys.argv[1]
        port = sys.argv[2]
    elif len(sys.argv) == 2:
        port = sys.argv[1]
    try:
        loop = asyncio.get_event_loop()
        loop.run_until_complete(start_server(host, port))
        loop.run_forever()
    except KeyboardInterrupt:
        print('Bye.')