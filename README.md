# 박찬우 — Liquid Glass Portfolio

박찬우 소프트웨어 엔지니어 포트폴리오입니다.
브라우저 확장, 렌더링 엔진, macOS 입력기, AI provider, Android/Linux 런타임처럼 서로 다른 환경의 제약을 어떻게 읽고 구조화했는지 보여주는 GitHub Pages 정적 사이트입니다.
UI는 웹용 Liquid Glass 엔진으로 구성했고, 카드와 버튼, 태그 칩, 프로젝트 상세 블록에는 요소별 glass profile이 적용됩니다.

Live: [https://meapri.github.io/Chanwoo-Park-Cover-Letter/](https://meapri.github.io/Chanwoo-Park-Cover-Letter/)

## What This Shows

- 첫 화면은 박찬우가 어떤 문제를 다루는 엔지니어인지 빠르게 읽히도록 구성했습니다.
- 대표 프로젝트 카드는 별도 상세 페이지로 이동하며, 각 페이지는 마주한 문제, 설계 방향, 구현 포인트, 살펴볼 파일, 엔지니어링 관점을 함께 설명합니다.
- Liquid Glass UI는 단순 투명 박스가 아니라 SVG `feDisplacementMap`, `backdrop-filter`, WebGL refraction, specular map, 자동 프로파일을 조합해 구성합니다.
- 주요 박스와 태그 칩은 `profile: "auto"`, `preset: "auto"`를 중심으로 엔진이 요소 크기와 의미에 맞는 glass profile을 선택합니다.
- 히어로 프로필 사진과 배경 이미지는 분리되어 있으며, 커서 위치에 따라 박스가 움직이는 pointer tilt는 꺼져 있습니다.
- `main` 브랜치에 push하면 GitHub Actions가 타입 체크와 빌드를 거쳐 GitHub Pages에 배포합니다.

## Tech Stack

| Layer | Used For |
| --- | --- |
| TypeScript | Liquid Glass 엔진, 자동 프로파일, glass 인스턴스 초기화 |
| Vite | 정적 포트폴리오 개발 서버와 Pages 빌드 |
| CSS | 반응형 레이아웃, 배경 장면, 타이포그래피, fallback 스타일 |
| SVG/WebGL | `feDisplacementMap`, refraction, displacement/specular map |
| GitHub Actions | `npm ci` → `typecheck` → `build` → Pages 배포 |

## Project Structure

```text
.
├── index.html                 # 포트폴리오 홈 마크업
├── projects/                  # 대표 프로젝트별 상세 페이지
├── demo/
│   ├── demo.ts                # data-glass 스캔 및 인터랙션 바인딩
│   ├── styles.css             # 페이지 레이아웃과 Liquid Glass 적용 스타일
│   └── assets/                # 배경 이미지와 프로필 사진
├── src/
│   ├── index.ts               # 엔진 공개 export
│   └── core/                  # LiquidGlass, AutoProfile, FilterChain 등 엔진 코어
├── tests/
│   ├── auto-profile.mjs       # 자동 프로파일 로직 검증
│   └── auto-quality.mjs       # 기기 품질 자동 조절 검증
├── vite.config.ts             # GitHub Pages base 포함 데모 빌드 설정
└── .github/workflows/deploy.yml
```

## Local Development

```bash
npm ci
npm run dev
```

개발 서버는 기본적으로 Vite `5173` 포트를 사용합니다.

```text
http://127.0.0.1:5173/Chanwoo-Park-Cover-Letter/
```

자주 쓰는 명령은 아래와 같습니다.

```bash
npm run typecheck      # TypeScript 타입 체크
npm run build          # GitHub Pages용 정적 빌드(dist-demo)
npm run preview        # 빌드 결과 미리보기
npm run build:lib      # Liquid Glass 라이브러리 빌드
npm test               # typecheck + auto-profile/auto-quality 테스트
```

## Liquid Glass Engine Notes

이 저장소의 포트폴리오는 별도의 이미지 효과로 유리를 흉내 내지 않고, DOM 요소마다 실제 필터를 생성합니다.

- `LiquidGlass`는 요소 크기, radius, DPR, profile/preset 설정을 기준으로 displacement/specular map을 생성합니다.
- `AutoProfile`은 요소 역할과 크기에서 `bar`, `control`, `card`, `panel`, `selection` 계열 프로파일을 해석합니다.
- `DeviceProfile`과 `quality: "auto"` 흐름은 모바일과 Android 같은 환경에서 고비용 효과를 조정합니다.
- `MapRaster`, `MapWorker`, `MapWorkerClient`는 displacement/specular map 생성을 worker 경로로 분리해 런타임 부하를 줄입니다.
- `ObserverRegistry`는 resize/intersection observer를 공유해 많은 glass 요소가 있을 때 관찰 비용을 낮춥니다.
- `WebGLRefractor`와 SVG filter 경로는 가능한 환경에서 굴절감을 보강하고, 지원이 약한 환경에서는 안전하게 내려갑니다.
- `MapCache`는 같은 크기의 요소가 동일한 맵을 재사용하게 해 초기화 비용을 줄입니다.
- 이 포트폴리오에서는 과한 pointer tilt를 끄고, 클릭 가능한 요소의 glass highlight와 포커스 상태만 유지합니다.
- 비지원 환경이나 reduced transparency 설정에서는 CSS `fallbackFilter`로 내려갑니다.

실제 페이지의 선언 예시는 아래처럼 단순하게 유지했습니다.

```html
<article
  class="project-card liquid-glass lg-interactive"
  data-glass='{"profile":"auto","preset":"auto","scheme":"light","radius":28}'
>
  ...
</article>
```

`demo/demo.ts`가 `[data-glass]` 요소를 스캔해 `new LiquidGlass(...)`를 생성합니다.
`.lg-interactive` 클래스는 클릭 가능한 요소의 커서와 상태 스타일에만 사용하며, 커서 위치 기반 3D tilt는 초기화하지 않습니다.

## Deployment

배포는 `.github/workflows/deploy.yml`에서 관리합니다.

1. `main` 브랜치 push 또는 수동 실행
2. Node 22 환경 구성
3. `npm ci`
4. `npm run typecheck`
5. `npm run build`
6. `dist-demo`를 GitHub Pages artifact로 업로드
7. Pages 배포

Vite `base`는 `/Chanwoo-Park-Cover-Letter/`로 설정되어 Pages 하위 경로에서 정적 자산이 올바르게 로드됩니다.

## Verification

배포 전 최소 확인 명령:

```bash
npm run build
npm test
```

렌더링 확인 항목:

- 첫 화면이 비어 있지 않고 Vite 오류 오버레이가 없어야 합니다.
- `.profile-photo`는 프로필 카드 안에서만 로드되어야 합니다.
- `.scene-image`는 배경 워크스테이션 이미지를 유지해야 합니다.
- 주요 glass 카드와 태그 칩은 `data-glass` 기반으로 엔진 인스턴스가 생성되어야 합니다.
- 프로젝트 상세 페이지의 요약 카드와 설명 블록도 Liquid Glass 인스턴스가 생성되어야 합니다.
- `.lg-interactive` 요소는 hover 중에도 커서 위치를 따라 이동하거나 기울어지지 않아야 합니다.
- 콘솔에 관련 error/warn이 없어야 합니다.

## License

MIT
