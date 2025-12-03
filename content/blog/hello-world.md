---
title: "Hello World 🤙"
date: 2025-12-01T12:00:00+01:00
draft: false
tags: ["hugo", "design", "Code"]
categories: ["tech"]
summary: "A demonstration of the custom terminal styling and render hooks."
---

Welcome to my blog! This is a just sample post to demonstrate the custom styling I've implemented.

## The Terminal Shortcode

I can explicitly wrap any content in a `terminal` window using the shortcode:

{{< terminal title="My Custom Window" >}}
System.out.println("Hello from the shortcode!");
{{< /terminal >}}

## Automatic Code Fences

Standard Markdown code fences are automatically wrapped in a terminal window with syntax highlighting and a copy button.

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


```javascript
// This is JavaScript
console.log('Traffic lights are cool.');
```

Enjoy the styling!
