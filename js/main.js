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

const keywords = ["endif", "enddo", "endwhile", "read", "do&nbsp;for", "else", "if", "while", "do", "write", "until","then"];

function beautify() {
	var res=""
	var lines = source.value.split('\n');
	for(k in lines) {
		line = lines[k];
		line=line.replaceAll(" ","&nbsp;").replaceAll(">","&gt;").replaceAll("<","&lt;");
		
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
					try {						
						if (token.substr(token.length-keywords[i].length)==keywords[i]) {
							var before=token.substr(0,token.length-keywords[i].length);
							if ((before=="" || !isAlphaNumeric(before[before.length-1]))) {
								token=token.substr(0,token.length-keywords[i].length)+`<span style="color:blue">${keywords[i]}</span>`;
							}
						}
					}
					catch(error) {}
				}
				line+=token
			}							
		}		
				
		res+=line+"<br/>";			
	}		
	
	result.innerHTML = res;
}

function isAlphaNumeric(str) {
  var code, i, len;

  for (i = 0, len = str.length; i < len; i++) {
    code = str.charCodeAt(i);
    if (!(code > 47 && code < 58) && // numeric (0-9)
        !(code > 64 && code < 91) && // upper alpha (A-Z)
        !(code > 96 && code < 123)) { // lower alpha (a-z)
      return false;
    }
  }
  return true;
};


source.value=`{
    read n
    do for i=1,n,1 {
        if i%2==0 {
            write i
        }
    }
}`;
beautify();


// prevent zoom:
document.body.addEventListener("wheel", e=>{if(e.ctrlKey) e.preventDefault();}, { passive: false});

