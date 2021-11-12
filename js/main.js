var source = document.getElementById('CodeInput');
var result = document.getElementById('CodeBeauty');

const inputHandler = function(e) {
  beautify();
}

source.addEventListener('input', inputHandler);

document.getElementById('CodeInput').addEventListener('keydown', function(e) {
  if (e.key == 'Tab') {
    e.preventDefault();
    var start = this.selectionStart;
    var end = this.selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    this.value = this.value.substring(0, start) +
      " "+" "+" "+" " + this.value.substring(end);

    // put caret at right position again
    this.selectionStart =
      this.selectionEnd = start + 4;
	  
	beautify();
  }
});

const keywords = ["read", "do&nbsp;for", "if", "while", "do", "write", "until"];

function beautify() {
	var res=""
	var lines = source.value.split('\n');
	for(k in lines) {
		line = lines[k];
		line=line.replaceAll(" ","&nbsp;");
		
		tokens = []
		isquote=false
		token=""
		for(var i in line) {
			if(line[i]=='"') {				
				if(!isquote) {
					isquote=true;
					if(token!="") tokens.push(token);
					token='"';
				}
				else {
					isquote=false;
					token+='"';
					if(token!="") tokens.push(token);
					token="";
				}
			}
			else token+=line[i]
		}
		if(token!="") tokens.push(token);		
		
		line=""
		
		for(var j in tokens) {
			token=tokens[j];
			
			if(token[0]=='"'){
				if ((token.length==1) || (token[token.length-1]!='"')) {
					line+=`<span style="color:red;text-decoration:underline">${token}</span>`;
				}
				else {
					line+=`<span style="color:magenta;">${token}</span>`;
				}
			} else {
				for(var i in keywords){
					token=token.replaceAll("&nbsp;"+keywords[i]+"&nbsp;",`&nbsp;<span style="color:blue">${keywords[i]}</span>&nbsp`);
					token=token.replaceAll("&nbsp;"+keywords[i]+"(",`&nbsp;<span style="color:blue">${keywords[i]}</span>(`);
				}
				line+=token
			}							
		}		
				
		res+=line+"<br/>";			
	}	
	//var strings=str.match(/( |\\\".*?\\\"|'.*?')/)
	//for(i in strings) {
		//console.log(strings[i]);
	//}	
	
	result.innerHTML = res;
}




source.value=`{\n    read n\n    write n\n}`;
beautify();


// prevent zoom:
document.body.addEventListener("wheel", e=>{if(e.ctrlKey) e.preventDefault();}, { passive: false});

