---
title: "Hello World 🤙"
date: 2025-12-01T12:00:00+01:00
draft: false
tags: ["hugo", "design", "Code"]
categories: ["tech"]
summary: "A demonstration of the custom terminal styling and render hooks."
cover:
  image: "images/hello.jpg"
  alt: "Hello World"
  relative: true # To use relative path for cover image, used in hugo Page-bundle
ShowToc: false
TocOpen: false

---

Welcome to my blog! This is a just sample post to demonstrate the custom styling I've implemented.

## The Terminal Shortcode

I can explicitly wrap any content in a `terminal` window using the shortcode. Plain content (no `lang`) gets the Monokai background and padding, but no syntax highlighting or line numbers:

{{< terminal title="My Custom Window" >}}
$ ./run.sh
[INFO] starting up...
[OK]   ready in 42ms
{{< /terminal >}}

Pass `lang` to get full syntax highlighting and line numbers, just like a code fence — but with whatever title you want:

{{< terminal lang="python" title="hello.py" >}}
def greet(name):
    """Greets the user."""
    return f"Hello, {name}!"

print(greet("0xlnz"))
{{< /terminal >}}

## Automatic Code Fences

Standard Markdown code fences are automatically wrapped in a terminal window with syntax highlighting and a copy button. You can override the default title (which is the language name, or `Terminal` for shell-like fences) with the `title=` attribute:

```bash {title="deploy.sh"}
./deploy --prod
```

```python
def greet(name):
    """Greets the user."""
    return f"Hello, {name}!"

print(greet("0xlnz"))
```

```bash
# This defaults to "Terminal" title
sudo rm -rf / --no-preserve-root
# Just kidding, don't do that.
```


```javascript {title="console.js"}
// This is JavaScript
console.log('Traffic lights are cool.');
```

Enjoy the styling!
