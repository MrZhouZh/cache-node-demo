# 浏览器缓存机制

Web 缓存减少了等待时间和网络流量，因此减少了显示资源表示形式所需的时间

## 强缓存

浏览器发起请求后不会直接向服务器请求数据，直接先到达强缓存阶段, 如果强缓存命中直接返回，如果没有命中进入协商缓存策略

### Expires & Cache-Control

分为 `Expires` 和 `Cache-Control`

#### **Expires**

属于 HTTP 1.0 时期的, 在响应中设置，示例如下：

```js
response.writeHead(200, {
    'Content-Type': 'text/javascript',
    'Expires': new Date('2020-09-27 14:45:00'),
});
```

> 由于Expires 是根据本地时间来的，所以一旦更改了本地时间，就会造成缓存失败

#### **Cache-Control**

Cache-Control 属于 HTTP1.0时代的产物，可以在请求头或响应头中设置

- 可缓存性

    - `public`：http 经过的任何地方都可以进行缓存
    - `private`：只有发起请求的这个浏览器才可以进行缓存，如果设置了代理缓存，那么代理缓存是不会生效的
    - `no-cache`：任何一个节点都不可以缓存（绕过强缓存，但是还会经过协商缓存）
- 到期

    - `max-age=`：设置缓存到多少秒过期
    - `s-maxage=`：会代替 max-age，只有在代理服务器（nginx 代理服务器）才会生效
    - `max-stale=`：是发起请求方主动带起的一个头，是代表即便缓存过期，但是在 max-stale 这个时间内还可以使用过期的缓存，而不需要向服务器请求新的内容

- 重新验证

    - `must-revalidate`：如果 max-age 设置的内容过期，必须要向服务器请求重新获取数据验证内容是否过期
    - `proxy-revalidate`：主要用在缓存服务器，指定缓存服务器在过期后重新从原服务器获取，不能从本地获取

- 其他

    - `no-store`：本地和代理服务器都不可以存储这个缓存，永远都要从服务器拿 body 新的内容使用（强缓存、协商缓存都不会经过）
    - `no-transform`：主要用于 proxy 服务器，告诉代理服务器不要随意改动返回的内容

两者对比

- HTTP 协议对比：如果同时使用 `Cache-Control` 的 `max-age` 与 `Expires，`则 `max-age` 优先级会更高，会忽略`Expires`
- 优先级对比：`Expires` 属于 HTTP 1.0 时代的产物，`Cache-Control` 属于 HTTP 1.1 时代的产物
- 缓存单位：`Expires` 与 `Cache-Control` 两者的缓存单位都是以时间为维度，如果我要根据文件的内容变化来判断缓存是否失效怎么办呢？就需要用到协商缓存了。 

## 协商缓存

如果强缓存未命中或用户强刷新后进入协商缓存，服务器根据浏览器请求的表示判断，如果协商缓存生效返回 **304** 否则返回 **200**。 协商缓存的实现基于 `Last-Modified`、`ETag` 这个需要在 **HTTP headers** 中设置

#### Last Modified/if-Modified-Since

`Last-Modified`是在服务端设置进行响应， `if-Modified-Since`是在浏览器端根据服务端上次在 **Response Headers**中设置的 `Last-Modified`取其值，如果存在请求时设置其 **Request Headers**值 `if-Modified-Since`传到服务器，服务器也是拿到这个值进行对比，下面是示例：

```js
const mtime = fs.statSync(filepath).mtime.toGMTString();
const requestMTime = request.headers['if-Modified-Since'];
// 走协商缓存
if (mtime === requestMTime) {
    response.statusCode = 304;
    response.end();
    return;
}
// 协商缓存失效设置 Last-Modified 响应头
response.writeHead(200, {
    'Content-Type': 'text/javascript',
    'Last-Modified': mtime,
});
```

#### ETag & if-none-match

`Last-Modified` 是以文件的修改时间来判断，`Etag` 是根据文件的内容是否修改来判断，如果 `Etag` 有修改重新获取新的资源返回，如果未修改返回 **304** 通知客户端使用本地缓存。

```
const fileMd5 = md5(buffer); // 文件的 md5 值
const noneMatch = request.headers['if-none-match']; // 来自浏览器端传递的值

if (noneMatch === fileMd5) {
    response.statusCode = 304;
    response.end();
    return;
}

response.writeHead(200, {
    'Content-Type': 'text/javascript',
    'Cache-Control': 'max-age=0',
    'ETag': fileMd5,
});
```

`Last-Modified` 与 `Etag` 对比

- 精确度：`Last-Modified` 以时间（秒）为单位，如果出现 1 秒内文件多次修改，在 `Last-Modified` 缓存策略下也不会失效，`Etag` 是对内容进行 **Hash** 比较，只要内容变动 `Etag` 就会发生变化，精确度更高。
- 分布式部署问题：分布式部署必然涉及到负载均衡，造成的一种现象是 `Last-Modified` 的时间可能还不太一致，而 `Etag` 只要保证每台机器的 **Hash** 算法是一致的就可保证一致性。
- 性能消耗：`Etag` 需要读取文件做 Hash 计算，相比 `Last-Modified` 性能上是有损耗的。
- 优先级：如果 `Last-Modified/Etag` 同时设置，`Etag` 的优先级会更高些。
- 相同点：校验通过返回 **304** 通知客户端使用本地缓存，校验不通过重新获取最新资源，设置 `Last-Modified/Etag` 响应头，返回状态码 **200**

## 参考

- [理论加实践搞懂浏览器缓存策略](https://github.com/qufei1993/http-protocol/blob/master/docs/http-cache.md)
- [MDN - HTTP 缓存](https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Caching_FAQ)
