const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// 输入文件夹路径
const inputFolder = './a-1';
// 输出文件夹路径
const outputFolder = './a-2';
// 指定新的分辨率
const newWidth = 40;
const newHeight = 40;

// 确保输出文件夹存在
if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
}

// 读取输入文件夹中的所有文件
fs.readdir(inputFolder, (err, files) => {
    if (err) {
        console.error('无法读取文件夹内容:', err);
        return;
    }

    // 处理每个文件
    files.forEach(file => {
        const inputFilePath = path.join(inputFolder, file);
        const outputFilePath = path.join(outputFolder, file);

        // 使用sharp库修改图片分辨率
        sharp(inputFilePath)
            .resize(newWidth, newHeight)
            .toFile(outputFilePath, (err, info) => {
                if (err) {
                    console.error('处理文件出错:', file, err);
                } else {
                    console.log('成功处理文件:', file);
                }
            });
    });
});
