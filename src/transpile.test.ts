import transpile from "./transpile";

const test = `
<section class="hero u-relative">
    <div class="background">
      {{#if properties.backgroundVideo}}
      <video playsinline="" autoplay="" muted="" loop="">
        <source src="{{properties.backgroundVideo}}" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {{/if}} {{#if properties.backgroundImage}}
      <picture>
        <source srcset="{{properties.backgroundImage}}" />
        <img src="{{properties.backgroundImage.src}}" alt="{{properties.backgroundImage.alt}}" />
      </picture>
      {{/if}}
    </div>
    <div class="hero-inner">
      <div class="container">
        <div class="row align-items-center">
          <div class="col-12 col-lg-6 pe-lg-5">
            <div class="hero-content">
              <nav class="hero-breadcrumb" aria-label="breadcrumb">
                <ul class="breadcrumb">
                  {{#each properties.breadcrumb}}
                  {{this.metadata}}
                  <li class="breadcrumb-item{{#if this.active }} active{{/if}}">
                    <a href="{{this.url}}" aria-label="{{ this.label }}" {{#if this.rel}} rel="{{this.rel}}" {{/if}}{{#if this.active }} aria-current="page"{{/if}}>{{ this.label }}</a>
                  </li>
                  {{/each}}
                </ul>
              </nav>
              <h1 class="hero-title h2">{{ properties.title_prefix}} <br><span>{{ properties.title }}</span></h1>
              <p class="hero-lead">{{ properties.lead }}</p>
              
              <div class="hero-cta mt-lg-2">
                {{#if properties.primary}}
                <div>
                  {{properties.primary.metadata}}
                  <a href="{{ properties.primary.url }}" target="_self" class="btn btn-primary" aria-label="{{ properties.primary.label }}">
                    <span class="link-icon link-icon-arrow">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none"><path fill="#0D1116" d="M.285 12.877a.4.4 0 0 1-.001-.567L10.593 1.994h-8.49a.4.4 0 0 1-.4-.4V.4c0-.22.18-.4.4-.4H14v11.899a.4.4 0 0 1-.396.4l-1.193.012a.4.4 0 0 1-.404-.4V3.4L1.697 13.717a.4.4 0 0 1-.565 0l-.847-.841Z"/></svg>
                    </span>
                    {{ properties.primary.label }}
                  </a>
                </div>
                {{/if}}
                {{#if properties.secondary}}
                <div>
                  <a href="{{ properties.secondary.url }}" target="_blank" class="btn btn-outline" aria-label="{{ properties.secondary.label }}">
                    <span class="link-icon link-icon-arrow">
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none"><path fill="#0D1116" d="M.285 12.877a.4.4 0 0 1-.001-.567L10.593 1.994h-8.49a.4.4 0 0 1-.4-.4V.4c0-.22.18-.4.4-.4H14v11.899a.4.4 0 0 1-.396.4l-1.193.012a.4.4 0 0 1-.404-.4V3.4L1.697 13.717a.4.4 0 0 1-.565 0l-.847-.841Z"/></svg>
                    </span>
                    {{ properties.secondary.label }}
                  </a>
                </div>
                {{/if}}
              </div>
            </div>
          </div>
          {{#if properties.image}}
          <div class="col-12 col-lg-6 ps-lg-5">
            <div class="hero-media">
              <img width="670" class="mw-lg-none" src="{{ properties.image.src }}" alt="{{ properties.image.alt }}" />
            </div>
          </div>
          {{/if}}
        </div>
      </div>
    </div>
  </section>`;

console.log(
  transpile(test, {
    breadcrumb: {
      name: "Breadcrumb",
      type: "breadcrumb",
      description:
        "This is the breadcrumb that will appear at the top of the page above the title. Its an array of breadcrumb items (label, url, active).",
      default: [
        {
          label: "Previous",
          url: "#",
          active: false,
        },
        {
          label: "Current",
          url: "#",
          active: true,
        },
      ],
      rules: {
        required: false,
      },
    },
    title_prefix: {
      name: "Title Prefix",
      description:
        "This is the first part of the top level heading.  You should insert a short phrase or single word here. If you leave this out, the title will start with the bolded words.",
      type: "text",
      default: "Main heading",
      rules: {
        required: false,
        content: { min: 5, max: 25 },
        pattern: "^[a-zA-Z0-9 ]+$",
      },
    },
    title: {
      name: "Title",
      description:
        "The second part of the title string, a set of bolded words.",
      type: "text",
      default: "longer example.",
      rules: {
        required: true,
        content: { min: 10, max: 80 },
        pattern: "^[a-zA-Z0-9 ]+$",
      },
    },
    lead: {
      name: "Lead Text",
      type: "text",
      description:
        "This is the callout, several lines long. Use this to provide context.",
      default:
        "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent pharetra, ex eu fringilla scelerisque, massa justo dapibus quam, in ultricies mi tellus non augue.",
      rules: {
        required: true,
        content: { min: 50, max: 300 },
        pattern: "^[a-zA-Z0-9 ]+$",
      },
    },
    primary: {
      name: "Primary CTA",
      type: "button",
      description:
        "This is the text that will appear on the primary Call to Action button. It should be a short phrase or single word.",
      default: {
        label: "Primary CTA",
        url: "#",
        target: "_self",
        rel: "noopener",
      },
      rules: {
        required: true,
        content: { min: 5, max: 25 },
        pattern: "^[a-zA-Z0-9 ]+$",
      },
    },
    secondary: {
      name: "Secondary CTA",
      type: "button",
      description:
        "This is the text that will appear on the secondary Call to Action button. It should be a short phrase or single word.",
      default: {
        label: "Secondary CTA",
        url: "#",
      },
      rules: {
        required: true,
        content: { min: 5, max: 25 },
        pattern: "^[a-zA-Z0-9 ]+$",
      },
    },
    backgroundVideo: {
      name: "Background Video",
      description:
        "This is the background video that will appear behind the text. It should be a high quality image or video that is relevant to the content.",
      type: "video_file",
      default:
        "https://www.intralinks.com/sites/default/files/videos/Inner_1_nobg.mp4",
      rules: {
        required: false,
        dimensions: {
          min: {
            width: 600,
            height: 600,
          },
          max: {
            width: 1920,
            height: 1080,
          },
          recommend: {
            width: 1340,
            height: 860,
          },
        },
        filesize: 1000000,
      },
    },
    backgroundImage: {
      name: "Background Image",
      description:
        "This is the background image that will appear behind the text. It should be a high quality image or video that is relevant to the content.",
      type: "image",
      default: "https://picsum.photos/800",
      rules: {
        required: false,
        dimensions: {
          min: {
            width: 600,
            height: 600,
          },
          max: {
            width: 1920,
            height: 1080,
          },
          recommend: {
            width: 1340,
            height: 860,
          },
        },
        filesize: 1000000,
      },
    },
    image: {
      name: "Image",
      type: "image",
      description:
        "This is the image that will appear on the right side of the hero section. It should be a high quality image that is relevant to the content.",
      rules: {
        required: true,
        dimensions: {
          min: {
            width: 450,
            height: 450,
          },
          max: {
            width: 2100,
            height: 900,
          },
          recommend: {
            width: 1340,
            height: 860,
          },
        },
      },
      default: "https://placehold.co/1340x860",
    },
  })
);
