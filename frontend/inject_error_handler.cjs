const fs = require("fs");
let html = fs.readFileSync("index.html", "utf8");
const errorScript = `
<script>
  window.addEventListener('error', function(event) {
    document.body.innerHTML += '<div style="color: red; padding: 20px; z-index: 9999; position: absolute; top: 0; left: 0; background: white;">' + event.message + '</div>';
  });
</script>
`;
if (!html.includes("window.addEventListener")) {
  html = html.replace("</head>", errorScript + "</head>");
  fs.writeFileSync("index.html", html, "utf8");
}
