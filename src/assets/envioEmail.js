import emailjs from "@emailjs/browser";
export function envioEmail(pag) {
  // Configuração do EmailJS
  // emailjs.send("service_tkyvtuc", "template_m4rffvp", {
  //   pagina: pag,
  //   email: "marcos.a.miguel@gmail.com",
  // }, "POj5AaM8IhRFgbpWq");

}

export function emailSobre(nome, assunto, mensagem) {
  // return emailjs.send("service_tkyvtuc", "template_kifaawr", {
  //   assunto: assunto,
  //   mensagem: mensagem,
  //   name: nome,
  //   email: "marcos.a.miguel@gmail.com",
  // }, "POj5AaM8IhRFgbpWq")
  //   .then((response) => {
  //     console.log("Mensagem enviada com sucesso:", response.status, response.text);
  //     localStorage.setItem("emailEnviado", "true");
  //     alert("Mensagem enviada com sucesso!");
  //     return true;
  //   })
  //   .catch((error) => {
  //     console.error("Erro ao enviar mensagem:", error);
  //     localStorage.setItem("emailEnviado", "false");
  //     alert("Erro ao enviar mensagem. Tente novamente mais tarde.");
  //     return false;
  //   });
  return true; // Simulação de envio bem-sucedido para evitar erros no código de exemplo
}


