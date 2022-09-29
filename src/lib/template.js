export const template = (self, name, key, values, child) => {
   let template = self.options.template[name]
   if (values) {
      template = template.replace(/{\w+}/g, (x) => values[x.substring(1, x.length - 1)] || x)
   }
   if (key) {
      template = template.replace(/{\w+}/g, (x) => (x == '{key}' ? key : x))
   }
   if (child) {
      template = template.replace(/{\w+}/g, (x) => child[x.substring(1, x.length - 1)] || x)
   }
   template = template.replace(
      /{\w+}/g,
      (x) => self.options.template.strings[x.substring(1, x.length - 1)] || x
   )
   return template
}
