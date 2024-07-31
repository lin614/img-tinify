const tinify = require("tinify");
const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");
const { exec } = require("child_process");
const { parseGIF, decompressFrames } = require("gifuct-js"); // 用于获取GIF信息

// 设置你的TinyPNG API密钥
tinify.key = "vQZh30M7gvXWB722scfJNqFHwK3PQ9st"; //替换为你的API密钥

// 指定原始图片文件夹和输出目标文件夹
const inputFolder = "./c";
const outputFolder = "./d";

// 允许的图片文件类型
const allowedExtensions = [
  ".png",
  ".gif",
  ".svg",
  ".webp",
  ".jpg",
  ".jpeg",
  ".bmp",
  ".jfif",
];

// 检查是否传入了 --webp 参数
const convertToWebp = process.argv.includes("--webp");

// 确保输出目录存在
async function ensureOutputDirectory(outputPath) {
  const dir = path.dirname(outputPath);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== "EEXIST") {
      throw err;
    }
  }
}

// 使用ffmpeg拆分GIF并转换为WebP动画
async function processGifToWebp(inputPath, outputPath) {
  console.log(`Processing GIF: ${inputPath}`);
  const tempDir = path.join(path.dirname(outputPath), "temp_frames");
  const webpDir = path.join(tempDir, "webp_frames");
  await fs.mkdir(tempDir, { recursive: true });
  await fs.mkdir(webpDir, { recursive: true });

  // 获取GIF帧信息
  const gifData = await fs.readFile(inputPath);
  const gif = parseGIF(gifData);
  const frames = decompressFrames(gif, true);
  const frameDelays = frames.map(frame => frame.delay); // 获取每一帧的延迟时间

  // 使用ffmpeg将GIF拆分为帧
  console.log(`Splitting GIF into frames: ${inputPath}`);
  await new Promise((resolve, reject) => {
    exec(`ffmpeg -i ${inputPath} ${tempDir}/frame_%04d.png`, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });

  // 压缩每一帧并转换为WebP
  const frameFiles = await fs.readdir(tempDir);
  for (const frameFile of frameFiles) {
    if (path.extname(frameFile).toLowerCase() === '.png') {
      const framePath = path.join(tempDir, frameFile);
      const webpFramePath = path.join(webpDir, frameFile.replace(/\.png$/, ".webp"));
      await sharp(framePath).toFormat("webp").toFile(webpFramePath);
      await tinify.fromFile(webpFramePath).toFile(webpFramePath);
      console.log(`Processed frame: ${webpFramePath}`);
    }
  }

  // 创建WebP动画参数文件
  const webpFrameFiles = await fs.readdir(webpDir);
  const listFile = path.join(tempDir, "frames.txt");
  const listFileContent = webpFrameFiles
    .filter(frameFile => path.extname(frameFile).toLowerCase() === '.webp')
    .map((frameFile, index) => `file '${path.join(webpDir, frameFile).replace(/\\/g, '/')}'\nduration ${frameDelays[index] / 100}`)
    .join("\n");
  await fs.writeFile(listFile, listFileContent);
  console.log(`Created frame list file: ${listFile}`);

  // 确保 frames.txt 文件已创建
  try {
    await fs.access(listFile);
  } catch (err) {
    console.error("Error creating frames.txt file:", err);
    throw err;
  }

  // 使用ffmpeg将WebP帧合成为WebP动画
  console.log(`Combining frames into WebP animation: ${outputPath}`);
  await new Promise((resolve, reject) => {
    exec(
      `ffmpeg -f concat -safe 0 -i ${listFile.replace(/\\/g, '/')} -loop 0 ${outputPath.replace(/\\/g, '/')}`,
      async (err) => {
        if (err) return reject(err);
        // 删除临时帧文件夹
        await fs.rm(tempDir, { recursive: true, force: true });
        console.log(`WebP animation created: ${outputPath}`);
        resolve();
      }
    );
  });
}

// 递归遍历文件夹并压缩图片
async function compressImagesInFolder(inputFolderPath) {
  try {
    const files = await fs.readdir(inputFolderPath);

    for (const file of files) {
      const filePath = path.join(inputFolderPath, file);
      const relativePath = path.relative(inputFolder, inputFolderPath);
      let outputPath = path.join(outputFolder, relativePath, file);
      const fileExtension = path.extname(filePath).toLowerCase();

      try {
        const stat = await fs.stat(filePath);
        // 确保输出目录存在
        await ensureOutputDirectory(outputPath);
        if (stat.isDirectory()) {
          // 如果是文件夹，递归处理
          console.log(`Entering directory: ${filePath}`);
          await compressImagesInFolder(filePath);
        } else if (stat.isFile() && allowedExtensions.includes(fileExtension)) {
          if (fileExtension === ".gif" && convertToWebp) {
            // 处理GIF图片为WebP动画
            outputPath = outputPath.replace(/\.\w+$/, ".webp");
            await processGifToWebp(filePath, outputPath);
          } else if (convertToWebp) {
            // 转换为WebP格式
            outputPath = outputPath.replace(/\.\w+$/, ".webp");
            await sharp(filePath).toFormat("webp").toFile(outputPath);
            await tinify.fromFile(outputPath).toFile(outputPath);
            console.log(`Compressed and converted to WebP: ${outputPath}`);
          } else {
            // 压缩图片
            await tinify.fromFile(filePath).toFile(outputPath);
            console.log(`Compressed: ${outputPath}`);
          }
        }
      } catch (err) {
        console.error("Error processing file:", filePath, err);
      }
    }
  } catch (err) {
    console.error("Error reading folder:", inputFolderPath, err);
  }
}

// 主函数，开始压缩图片
async function main() {
  console.log(`Starting compression in folder: ${inputFolder}`);
  await compressImagesInFolder(inputFolder);
  console.log(`Compression completed.`);
}

// 启动主函数
main();
