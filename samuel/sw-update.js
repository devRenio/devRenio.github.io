/* 이전 버전의 서비스 워커를 교체할 때 열린 탭을 새 버전으로 다시 불러옵니다. */
let replacingOldSw = false;

self.addEventListener("install", () => {
  replacingOldSw = Boolean(self.registration.active);
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      if (!replacingOldSw) return;

      const windows = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      await Promise.all(
        windows.map((client) =>
          "navigate" in client ? client.navigate(client.url) : Promise.resolve(),
        ),
      );
    })(),
  );
});
