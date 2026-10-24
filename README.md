# 汇知 · 文档智能工作台

汇知是一个中文文档整理网站：GitHub Pages 托管前端，FastAPI 后端负责解析文件并调用 OpenAI API。真实分析需要先部署后端并配置服务端环境变量。

## 支持的格式

- PDF（可提取文字的 PDF；扫描版 PDF 暂不做 OCR）
- Word：DOCX
- PowerPoint：PPTX
- Excel：XLSX
- TXT、Markdown

旧版二进制格式 DOC、PPT、XLS 暂不支持；请另存为 DOCX、PPTX、XLSX 后上传。单个文件最多 20 MB，每次最多 8 个文件，提取文字总量最多 120,000 字符。当前版本不保存上传文件到永久资料库。

## 仓库结构

```text
index.html
styles.css
app.js
config.js
README.md
backend/
  main.py
  requirements.txt
  .env.example
```

## 部署后端（Render，新手路线）

1. 登录 Render，并选择 **New → Web Service**，连接此 GitHub 仓库。
2. 选择 Python 环境；**Root Directory** 填 `backend`。
3. **Build Command**：`pip install -r requirements.txt`
4. **Start Command**：`uvicorn main:app --host 0.0.0.0 --port $PORT`
5. 在服务的 Environment 设置中添加：
   - `OPENAI_API_KEY`：你的 OpenAI API 密钥（只填在 Render 的私密环境变量设置里）
   - `OPENAI_MODEL`：`gpt-4.1-mini`（也可设置为你账号可用的模型）
   - `FRONTEND_ORIGINS`：`https://bennyzhang-boom.github.io`
6. 点击部署，等待成功。访问 Render 分配的服务地址加上 `/health`，应返回 `{"status":"ok"}`。

不要把密钥贴到聊天、写入文件、提交到 GitHub，或放在浏览器开发者工具可见的前端变量里。OpenAI API 可能单独计费，ChatGPT 订阅不等同于 API 额度。

## 连接前端

1. 部署成功后，复制 Render 服务的基础地址，例如 `https://your-service.onrender.com`（用你自己的实际地址）。
2. 打开仓库中的 `config.js`，把空字符串改为服务地址：

   ```js
   window.HUIZHI_API_BASE = "https://your-service.onrender.com";
   ```

   这里只能放公开的后端网址，不放密钥。
3. 提交 `config.js` 修改，等待 GitHub Pages 自动发布。
4. 打开网站，上传一个不含敏感信息的测试文件，点击“开始智能整理”。

## 本地运行后端

进入 `backend` 目录后：

```bash
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
# 先在当前终端设置 OPENAI_API_KEY 环境变量，再运行：
uvicorn main:app --reload
```

本地测试时将 `config.js` 的地址设置为 `http://127.0.0.1:8000`。真实密钥不要放进任何项目文件。

## 安全与限制

- 后端限制文件类型、单文件大小、文件数量和提取文本总量；有基础的 IP 频率限制。
- 频率限制为原型级保护，正式公开服务前应增加可靠的用户身份验证、持久化限流和滥用监控。
- 文件内容会发送到你部署的后端，并用于调用 OpenAI API；请只上传有权处理的资料，不要上传敏感个人信息或机密文件。
- 扫描版 PDF 需要 OCR；旧版 DOC/PPT/XLS 不在当前解析范围。
- AI 结果可能不准确，引用和结论应回到原文核对。
