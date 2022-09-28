const fs = require("fs");
const sass = require("sass");

const files = ["consentcontrol", "bootstrap"];

for (const file_name of files) {
   let input_file = `./src/scss/${file_name}.scss`;
   let output_file = `./dist/${file_name}.css`;

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