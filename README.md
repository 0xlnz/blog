# My Personal Blog

This is a personal blog built with [Hugo](https://gohugo.io/) and the [PaperMod](https://github.com/adityatelange/hugo-PaperMod) theme.

## Features
- **Profile Mode**: Minimalist landing page.
- **Terminal Styling**: Custom render hooks and CSS to give code blocks a macOS terminal look.
- **Copy Button**: Automatic copy-to-clipboard for all code blocks.
- **GitHub Actions**: Automated deployment to GitHub Pages.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/0xlnz/blog.git
    cd blog
    ```

2.  **Install Hugo:**
    Ensure you have [Hugo Extended](https://gohugo.io/installation/) installed.

3.  **Run locally:**
    ```bash
    hugo server -D
    ```

## Deployment

This repository is configured to deploy to GitHub Pages using GitHub Actions.

1.  Push your changes to the `main` branch.
2.  Go to your GitHub repository Settings > Pages.
3.  Under "Build and deployment", select **GitHub Actions** as the source.
4.  The action should trigger automatically on push.

## Customization

-   **Config**: Edit `hugo.yml` to change your profile details, social links, and menu items.
-   **Styling**: Custom CSS is located in `assets/css/extended/terminal.css`.
-   **Content**: Add new posts in `content/posts/`.

## License

MIT
