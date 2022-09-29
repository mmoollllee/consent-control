const fs = require("fs");
const sass = require("sass");

const files = ["ConsentControl", "ConsentControl.bootstrap", "ConsentMessage"];

for (const file of files) {
  let input_file;
  let output_file;

  const words = file.split(".");
  const component = words[0];
  const file_name = words[1] || false;

  if (file_name) {
    input_file = `./src/${component}/scss/${file_name}.scss`;
    output_file = `./dist/${component.toLowerCase()}.${file_name}.css`;
  } else {
    input_file = `./src/${component}/scss/main.scss`;
    output_file = `./dist/${component.toLowerCase()}.main.css`;
  }

  console.log(`${input_file} → ${output_file}...`);

  sass.render(
    {
      file: input_file,
      outputStyle: "compressed",
    },
    (error, result) => {
      if (!error) {
        fs.writeFile(output_file, result.css, (err) => {
          if (!err) {
            console.log(`Created ${output_file}`);
          } else {
            console.error(err);
          }
        });
      } else {
        console.error(error);
      }
    }
  );
}