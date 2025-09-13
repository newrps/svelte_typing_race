<script lang="ts">
  // 단순 표시용 플레이스홀더
  export let width = 160;   // px (120~300 사이 추천)
  export let height = 600;  // px (600~1050 추천)
  export let offsetTop = 80; // 상단에서부터 떨어뜨리기(px)
</script>

<div class="ad-rails" style={`--ad-w:${width}px; --ad-h:${height}px; --ad-top:${offsetTop}px`}>
  <aside class="ad left">
    <div class="box">
        <script src="https://ads-partners.coupang.com/g.js"></script>
        <script>
            new PartnersCoupang.G({"id":918595,"trackingCode":"AF0680713","subId":null,"template":"carousel","width":"160","height":"600"});
        </script>
    </div>
  </aside>
  <aside class="ad right">
    <div class="box">
        <script src="https://ads-partners.coupang.com/g.js"></script>
        <script>
            new PartnersCoupang.G({"id":918594,"trackingCode":"AF0680713","subId":null,"template":"carousel","width":"160","height":"600"});
        </script>
    </div>
  </aside>
</div>

<style>
  .ad-rails {
    position: fixed;
    inset: 0;
    pointer-events: none; /* 본문 클릭 방해 X */
    z-index: 20;
  }
  .ad {
    position: fixed;
    top: var(--ad-top);
    width: var(--ad-w);
    height: var(--ad-h);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none; /* 래퍼는 클릭 막음 */
  }
  .ad.left  { left:  max(0px, calc((100vw - 1100px)/2 - var(--ad-w) - 16px)); }
  .ad.right { right: max(0px, calc((100vw - 1100px)/2 - var(--ad-w) - 16px)); }

  .ad .box {
    width: var(--ad-w);
    height: var(--ad-h);
    /*
    border: 1px dashed #9ca3af;
    border-radius: 10px;
    background: linear-gradient(135deg,#f9fafb 0%,#eef2ff 100%);
    color: #4b5563;

    font-weight: 700;
    font-size: 18px;
    letter-spacing: .5px;
    display: grid;
    place-items: center;
    box-shadow: 0 2px 10px rgba(0,0,0,.05);*/
    pointer-events: auto; /* 실제 광고 링크 넣을 때 클릭 가능 */
    text-align: center;
    padding: 8px;
  }

  /* 작은 화면에서는 자동 숨김 */
  @media (max-width: 1280px) {
    .ad { display: none; }
  }
</style>
