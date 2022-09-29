export const toLocation = (url) => {
   const a = document.createElement('a')
   a.href = url
   return a
}
