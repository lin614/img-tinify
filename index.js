const tinify = require("tinify");
const fs = require("fs").promises;
const sharp = require("sharp");
const { Buffer } = require('buffer');
const path = require("path");

// 设置你的TinyPNG API密钥
tinify.key = "VQz61VRczKWLFsNn3JKgRnTQRlljChHV";

// 指定原始图片文件夹和输出目标文件夹
const inputFolder = "./a";
const outputFolder = "./b";

// 统计信息文件
const statsFile = "./compression_stats.txt";

// Lottie JSON文件的扩展名
const lottieExtension = ".json";

// 统计信息
let stats = [];

// 处理 Data URL
async function processDataUrl(dataUrl) {
  const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid input string');
  }
  return Buffer.from(matches[2], 'base64');
}

// 处理 Lottie JSON 文件
async function processLottieJson(filePath) {
  const data = await fs.readFile(filePath, "utf8");
  const json = JSON.parse(data);

  for (let asset of json.assets) {
    if (asset.p && asset.p.startsWith('data:')) {
      const imageData = await processDataUrl(asset.p);
      const originalSize = imageData.length;

      const compressedImage = await sharp(imageData)
        .toFormat("webp")
        .toBuffer();
      const webpSize = compressedImage.length;

      const tinyCompressedImage = await tinify.fromBuffer(compressedImage).toBuffer();
      const compressedSize = tinyCompressedImage.length;
      console.log(asset.id || 'Unknown',
        originalSize,
        webpSize,
        compressedSize)
      const base64Image = tinyCompressedImage.toString('base64');
      const dataUrl = `data:image/webp;base64,${base64Image}`;

      asset.p = dataUrl;

      // 收集统计信息
      stats.push({
        name: asset.id || 'Unknown',
        originalSize,
        webpSize,
        compressedSize
      });
    }
  }

  await fs.writeFile(filePath, JSON.stringify(json));
}

// 递归遍历文件夹并压缩图片
async function compressImagesInFolder(inputFolderPath) {
  try {
    const files = await fs.readdir(inputFolderPath);

    for (const file of files) {
      const filePath = path.join(inputFolderPath, file);
      const relativePath = path.relative(inputFolder, inputFolderPath);
      const outputPath = path.join(outputFolder, relativePath, file);
      const fileExtension = path.extname(filePath).toLowerCase();

      try {
        const stat = await fs.stat(filePath);

        if (stat.isDirectory()) {
          // 如果是文件夹，递归处理
          await compressImagesInFolder(filePath);
        } else if (stat.isFile()) {
          if (fileExtension === lottieExtension) {
            // 处理 Lottie JSON 文件
            await processLottieJson(filePath);
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
  await compressImagesInFolder(inputFolder);

  // 写入统计信息到文件
  let statsData = "Image Compression Statistics:\n";
  statsData += stats.map(stat => `Name: ${stat.name}, Original Size: ${stat.originalSize} bytes, WebP Size: ${stat.webpSize} bytes, Compressed Size: ${stat.compressedSize} bytes`).join('\n');
  await fs.writeFile(statsFile, statsData);
}

// 启动主函数
main();
