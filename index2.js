const tinify = require("tinify");
const fs = require("fs").promises;
const path = require("path");

// 设置你的TinyPNG API密钥
tinify.key = "VQz61VRczKWLFsNn3JKgRnTQRlljChHV";

// 指定原始图片文件夹和输出目标文件夹
const inputFolder = "./c";
const outputFolder = "./d";

// 允许的图片文件类型
const allowedExtensions = [".png", ".gif", ".webp", ".jpg", ".jpeg", ".bmp"];

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
        } else if (stat.isFile() && allowedExtensions.includes(fileExtension)) {
          // 如果是文件且是支持的文件类型，压缩图片
          const source = tinify.fromFile(filePath);
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          await source.toFile(outputPath);
          console.log("Compressed:", filePath);
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
}

// 启动主函数
main();
