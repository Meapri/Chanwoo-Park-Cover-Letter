# 박찬우 — Liquid Glass Portfolio

박찬우 소프트웨어 엔지니어 자기소개 페이지입니다.
GitHub Pages에 배포되는 정적 포트폴리오이며, 직접 만든 웹용 Liquid Glass 엔진으로 카드, 내비게이션, 버튼, 태그 칩의 광학 질감을 구성했습니다.

Live: [https://meapri.github.io/Chanwoo-Park-Cover-Letter/](https://meapri.github.io/Chanwoo-Park-Cover-Letter/)

## What This Shows

- 브라우저 확장, Apple 플랫폼, ML 런타임, Android/Linux 실험, Python 에이전트 인프라 경험을 한 페이지에서 읽히도록 정리했습니다.
- 단순 CSS 투명 박스가 아니라 SVG `feDisplacementMap`, `backdrop-filter`, 스페큘러 림, 자동 프로파일을 조합한 Liquid Glass 렌더링 엔진을 실제 페이지에 적용했습니다.
- 모든 주요 박스와 태그 칩은 `profile: "auto"`, `preset: "auto"`, `refraction: "auto"`, `thickness: "auto"`, `blur: "auto"` 기반으로 엔진이 문맥에 맞춰 유리 강도를 조정합니다.
- 히어로 프로필에는 별도 프로필 사진을 사용하고, 헤더와 배경은 독립된 비주얼 자산을 유지합니다.
- `main` 브랜치에 push하면 GitHub Actions가 타입 체크와 빌드를 거쳐 GitHub Pages에 배포합니다.

## Tech Stack

| Layer | Used For |
| --- | --- |
| TypeScript | Liquid Glass 엔진, 자동 프로파일, 인터랙션 초기화 |
| Vite | 정적 포트폴리오 개발 서버와 Pages 빌드 |
| CSS | 반응형 레이아웃, 배경 장면, 타이포그래피, fallback 스타일 |
| SVG Filter | `feDisplacementMap` 기반 굴절과 색수차 |
| GitHub Actions | `npm ci` → `typecheck` → `build` → Pages 배포 |

## Project Structure

```text
.
├── index.html                 # 포트폴리오 페이지 마크업
├── demo/
│   ├── demo.ts                # data-glass 스캔 및 인터랙션 바인딩
│   ├── styles.css             # 페이지 레이아웃과 Liquid Glass 적용 스타일
│   └── assets/                # 배경 이미지와 프로필 사진
├── src/
│   ├── index.ts               # 엔진 공개 export
│   └── core/                  # LiquidGlass, AutoProfile, FilterChain 등 엔진 코어
├── tests/
│   └── auto-profile.mjs       # 자동 프로파일 로직 검증
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
npm test               # typecheck + auto-profile 테스트
```

## Liquid Glass Engine Notes

이 저장소의 포트폴리오는 별도의 이미지 효과로 유리를 흉내 내지 않고, DOM 요소마다 실제 필터를 생성합니다.

- `LiquidGlass`는 요소 크기, radius, refraction, thickness, DPR을 기준으로 displacement/specular map을 생성합니다.
- `AutoProfile`은 요소 역할과 크기에서 `bar`, `control`, `card`, `panel`, `selection` 계열 프로파일을 해석합니다.
- `quality: "auto"`는 기기 성능 신호에 따라 고비용 효과를 조정합니다.
- `MapCache`는 같은 크기의 요소가 동일한 맵을 재사용하게 해 초기화 비용을 줄입니다.
- `LiquidInteractive`는 `.lg-interactive` 요소에 pointer tilt, glare, press morph를 붙입니다.
- 비지원 환경이나 reduced transparency 설정에서는 CSS `fallbackFilter`로 내려갑니다.

실제 페이지의 선언 예시는 아래처럼 단순하게 유지했습니다.

```html
<article
  class="project-card liquid-glass lg-interactive"
  data-glass='{"profile":"auto","preset":"auto","scheme":"light","radius":28,"refraction":"auto","thickness":"auto","blur":"auto","saturation":"auto"}'
>
  ...
</article>
```

`demo/demo.ts`가 `[data-glass]` 요소를 스캔해 `new LiquidGlass(...)`를 생성하고, `.lg-interactive` 요소에는 인터랙션을 바인딩합니다.

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
- 콘솔에 관련 error/warn이 없어야 합니다.

## License

MIT
