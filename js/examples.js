examples = [];

function fetchExamples() {
	examples_url="https://github.com/DummyThinker/PsCode/tree/master/examples"
	fetch(examples_url, {credentials:"include"})
	  .then((response) => {
		return response.text());
	  })
	  .then((html) => {
		console.log(html);
	  });
}