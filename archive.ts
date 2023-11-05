// const main = async () => {
//   while (true) {
//     await pixelpusher.doSend("/home/julian/mystery/img/c7025ceb4a07a453b0bfa0583cb305a7.png");
//     await new Promise((resolve, reject) => setTimeout(resolve, 1000));
//     await pixelpusher.doSend("/home/julian/mystery/img/mushroom.png");
//     await new Promise((resolve, reject) => setTimeout(resolve, 1000));
//     await pixelpusher.doSend("/home/julian/mystery/img/97d3c95b351667ade525df8b1fc9f153.png");
//     await new Promise((resolve, reject) => setTimeout(resolve, 1000));
//     await pixelpusher.doSend("/home/julian/mystery/img/heart.jpg");
//     await new Promise((resolve, reject) => setTimeout(resolve, 1000));
//   }
// }

// main();

// async function checkFileExists(file: string) {
//   return fs.promises
//     .access(file, fs.constants.F_OK)
//     .then(() => true)
//     .catch(() => false);
// }

// async function uploadImage(file: string) {
//   try {
//     const client = await Client({
//       host: "julianhartline.com",
//       port: 22,
//       username: "julianh2o",
//       password: "Dr34Mings",
//     });
//     await client.uploadFile(
//       file,
//       "/home/julianh2o/julianhartline.com/rpi/out.bmp",
//     );
//     client.close();
//   } catch (e) {
//     console.log(e);
//   }
// }

// const cardreader = new CardReader();
// cardreader.on("cardScanned", async (id: string) => {
//   const f = path.join(__dirname, "img", `${id}.bmp`);
//   const exists = await checkFileExists(f);
//   console.log({ f, id, exists });
//   if (!exists) return;
//   await uploadImage(f);
// });
