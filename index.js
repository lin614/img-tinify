const tinify = require("tinify");
const fs = require("fs").promises;
const path = require("path");
const sharp = require("sharp");

// 设置你的TinyPNG API密钥
tinify.key = "vQZh30M7gvXWB722scfJNqFHwK3PQ9st"; //cofiy81414-
// tinify.key = "tKPYkGBbXlHTMFFWxMcyVyBW7DvH8smg"; //gexat80448-
// tinify.key = "0xj2xlvJ2VfcrYQ39BgM0V2bdt7BnnFb";//gexat80448-7.23,308
// tinify.key = "YRclqCbNPPhMkNs1vHZ0svNz3yFXwKk1";//jawija4485-7,23
// tinify.key = "ch8wxwbmPJzJ4fMzqS1Ch3mMGGYnmXmK";//jawija4485
// tinify.key = "VQz61VRczKWLFsNn3JKgRnTQRlljChHV";

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
          await compressImagesInFolder(filePath);
        } else if (stat.isFile() && allowedExtensions.includes(fileExtension)) {
          // 如果是文件且是支持的文件类型
          if (convertToWebp) {
            // 转换为WebP格式
            outputPath = outputPath.replace(/\.\w+$/, ".webp");
            await sharp(filePath).toFormat("webp").toFile(outputPath);

            // fs.unlink(filePath, (err) => {
            //   if (err) return console.error("文件删除失败:", err);
            //   console.log(filePath + "文件删除成功");
            // });
          }

          // 压缩图片
          await tinify.fromFile(outputPath).toFile(outputPath);
          console.log("Compressed:", outputPath);
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
