function BlockTree() {
	this.type="block";
	//this.
}

function CodeBuilder(psc_src){	
	
	var lines = psc_src.split("\n");
	
	function genErr(li,text) {
		return `Error at line ${Number(li)+1}:<br/><br/>&gt;&gt;${lines[li]}<br/><br/>${text}`;
	}
	
	finals=[]
	
	for(var l in lines){
		line = lines[l];
		
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
		
		nosptk = [];					
		for(var i in tokens) {
			var token=tokens[i]
			if(token[0]=='"') {
				nosptk.push(token);
			}
			else {
				var wosp = token.split(" ");
				
				for(var w in wosp) {
					var word=wosp[w];
					if(word.length>0){					
						token=""
						var pushed=false
						for(var q=0;q<word.length;q++) {														
							if(q<word.length-1) {
								if(word[q]==word[q+1]) {
									if(word[q]=='=' || word[q]=='&' || word[q]=='|') {
										if(token!="") nosptk.push(token);										
										nosptk.push(word[q]+word[q]);
										token="";
										q+=2;											
									}
								}
								if((word[q]=='!' && word[q+1]=='=') || ((word[q]=='<' && word[q+1]=='=') || (word[q]=='>' && word[q+1]=='='))) {
									if(token!="") nosptk.push(token);
									nosptk.push(word[q]+word[q+1]);
									token="";
									q+=2;		
								}
							}
							if(q<word.length) {
								if('{}()%+-*/=<>!,'.includes(word[q])) {									
									if(token!="") nosptk.push(token);
									token="";					
									nosptk.push(word[q]);										
								}
								else {
									token+=word[q];
								}
							}							
						}
						if(token!="") nosptk.push(token);						
					}
				}				
			}
		}				
		
		//console.log(nosptk);
		for(var x in nosptk) {
			var tk=nosptk[x];
			if(x<nosptk.length-1 && tk=="}") {								
				this.error=genErr(l,"Expected new line after '}'.");
				return;
			}
		}
		if(l==0 && nosptk[0]!="{") {
			this.error=genErr(0,"Expected '{' at the begin of the program.");
			return;
		}
				
		if(l==lines.length-1 && nosptk[nosptk.length-1]!="}") {			
			this.error=genErr(lines.length-1,"Expected '}' at the end of the program.");
			return;
		}			
		
		finals.push.apply(finals,nosptk);
		finals.push("");
	}		
	
	this.symbols={};
	for(var i in finals) {
		if(!keywords.includes(finals[i]) && !("{}()%+-/*=<>!,".includes(finals[i])) &&
				finals[i]!="for" && !isNumeric(finals[i]) && !["||","==","!=","<=",">=","&&"].includes(finals[i]) && finals[i][0]!='"') {			
			this.symbols[finals[i]]=0;
			finals[i]=`$__sym["${finals[i]}"]`;
		}
	}	
	
	this.finals=finals;	
		
	console.log(this.finals);
	
	this.processed = [];
			
	var symbols = [];
	var i=0;
	while(i<finals.length){			
		var token=finals[i];
		
		if(token=="{") {
			this.processed.push("{");
			i++;
			continue;
		}		
		else if(token=="}") {					
			this.processed.push("}");
			i++;
			continue;
		}
		else if(token=="read") {		
			this.processed.push("read")
			i++;			
			if(i<finals.length) {
				var lst=[finals[i]]								
				i++;				
				while(i<finals.length && finals[i]==',') {										
					lst.push(finals[i+1])
					i+=2;
				}				
				this.processed.push(lst)				
				continue;
			}			
		}
		else if(token=="write") {			
			this.processed.push("write")
			i++;			
			if(i<finals.length) {	
				var lst=[]
				lst.push(finals[i])				
				i++;				
				while(i<finals.length && finals[i]==',') {										
					lst.push(finals[i+1])
					i+=2;
				}						
				this.processed.push(lst);
				continue;
			}			
		}
		else if(token=="if" || token=="while") {			
			this.processed.push(token);
			var condition=""			
			i++;			
			while(i<finals.length && finals[i]!="do" && finals[i]!="then" && finals[i]!="" && finals[i]!="{") {
				condition+=finals[i];				
				i++;
			}			
			this.processed.push(condition);
			if(finals[i]=="do" && token=="if") {
				this.error='"if... do" is not a statement.';
				return;
			}
			if(finals[i]=="then" && token=="while") {
				this.error='"while... then" is not a statement.';
				return;
			}			
			continue;
		}		
		else if(token=="else"){		
			this.processed.push("else");								
			i++;
			continue;
		}
		else if(i<finals.length-1 && finals[i+1]=='=') {			
			rhand="";
			i+=2;
			while(i<finals.length-1 && finals[i]!="") {
				rhand+=finals[i];
				i++;
			}
			this.processed.push(`${token}=${rhand}`)			
			continue;
		}
		else if(finals[i]=="do" && finals[i+1]=="for") {
			var it="";
			var start="";
			var stop="";
			var step="";
			i+=2;
			while(finals[i]!='=') {
				it+=finals[i]; i++;
			}
			i++;
			while(finals[i]!=",") {
				start+=finals[i]; i++;
			}
			i++;
			while(finals[i]!=",") {
				stop+=finals[i]; i++;
			}
			i++;
			while(finals[i]!="{") {
				step+=finals[i]; i++;
			}			
			this.processed.push("for");
			var lst=[]
			lst.push(it);
			lst.push(start);
			lst.push(stop);
			lst.push(step);
			this.processed.push(lst)
			continue;
		}
		else if(token=="") {
			i++;
			continue;
		}
		i++;
	}	
	
	console.log(this.processed);
	
	this.entryPoint=new Instruction("main",[]);	
	this.entryPoint.innercode=this.processed.slice(1,-1);
	
	this.entryPoint.compile();
	
	console.log(this.entryPoint);
	
	this.crt=null;	
	this.interval = null;	
	
	this.execute = function() {
		if(this.error!==undefined) {
			return;
		}		
		var self=this;
		this.crt=this.entryPoint;
		var crt=this.crt;	
		for(var i in self.symbols) {
			self.symbols[i]=0;
		}
		
		this.interval = setInterval(function(){						
			if(crt!=null){
				try {
					crt=crt.execute(self.symbols);
				}
				catch(e) {
					consoleWriteError(e);
					self.stop();
					return;
				}
			}
		},1);		
	}
	
	this.stop = function() {		
		clearInterval(this.interval);		
	}
	
}

function Instruction(name,args,next=null,condition=null,nextnc=null) {	
	this.name=name;
	this.args=args;
	this.next=next;
	this.condition=condition;
	this.nextnc=nextnc;
	this.loop = false;
	
	this.innercode = []
	
	this.set_next=function(ins) {
		console.log(ins.name);
		if(this.name=="while" || this.name=="for") {			
			this.loop=true;
			if(this.isCompiling) {
				this.next=ins;
				return this.next;
			} else {
				this.nextnc=ins;
				return this.nextnc;
			}
		} else {
			this.next=ins;
			return this.next;
		}
	}
	
	this.isCompiling=false;
	
	this.execute = function(symbols) {
		var $__sym = symbols;
		console.log(this.name);
		if(this.name=="read") {			
			for(var i in this.args) {				
				var name=this.args[i];
				var dname = name.slice(8,-2);
				//console.log(`${this.args[i]}=Number(window.prompt(${this.args[i]}+"="))`);
				eval(`${name}=window.prompt(dname+"=")`);								
			}
			return this.next;
		}
		if(this.name=="write") {				
			for(var i in this.args) {
				var name=this.args[i];
				consoleWrite(eval(`${name}`));				
			}
			return this.next;
		}
		if(this.name.startsWith("$__sym")) {			
			eval(this.name);			
			return this.next;
		}
		if(this.name=="while" || this.name=="if") {
			//console.log(`${this.condition}`);
			var c = eval(`${this.condition}`);
			//console.log("CCCCCCCCCCC ",c);
			return c ? this.next : this.nextnc;		
		}
		if(this.name=="for") {
			var iter = this.args[0];
			var start = this.args[1];
			var stop = this.args[2]
			var step = this.args[3];
			var dir = eval(`Number(${stop})-Number(${start})`);
			console.log(stop)
			console.log(start)
			console.log(`${stop}-${start}`);
			console.log("dir=",dir);
			
			function cont() {
				if(dir>=0) {
					return eval(`Number(${stop})`)>=eval(`Number(${iter})`)					
				} else {
					return eval(`Number(${stop})`)<=eval(`Number(${iter})`)
				}					
			}
			
			if(!this.inited) {
				eval(`${iter}=Number(${start})`);				
				
				if(!cont()) {
					return this.nextnc;
				}
				
				this.inited=true;							
			} else {
				eval(`${iter}=Number(${iter})+Number(${step})`);
				if(cont()) {
					return this.next;
				} else {
					this.inited=false;
					return this.nextnc
				}
			}			
		}
		return this.next;
	}
	
	this.inited=false;
	
	this.compile = function(){		
		console.log("compiling",this.name);
		var ins=this;
		var inc=this.innercode;
		for(var i=0;i<inc.length;i++) {
			if(inc[i]=="write" || inc[i]=="read") {
				var name=inc[i++];
				var args=inc[i];								
				ins=ins.set_next(new Instruction(name,args));
				continue;
			}			
			if(inc[i].startsWith("$__sym")) {
				var name=inc[i];
				ins=ins.set_next(new Instruction(name,[]));			
				continue;
			}
			if(inc[i]=="for" || inc[i]=="while") {
				var name=inc[i++];
				var cond=inc[i++];
				ins=ins.set_next(new Instruction(name,[]));			
				if(name=="while"){
					ins.condition=cond;
				}	
				else {
					ins.args=cond
				}
				var inner=[];
				if(inc[i]=="{") {
					i++;
					var pcnt=1;
					while(i<inc.length && pcnt>0){
						if(inc[i]=="{") {
							pcnt++;
						} else if(inc[i]=="}") {
							pcnt--;
						}			
						if(pcnt>0) {
							inner.push(inc[i]);
						}
						i++;
					}
					i--;					
				}
				else {
					/// ERROR 
				}
				ins.innercode=inner;
				//console.log(">>",ins.name);
				ins.isCompiling=true;
				var last_cmp = ins.compile();				
				last_cmp.next = ins;
				ins.isCompiling=false;
				continue;
			}
			if(inc[i]=="if") {
				var name=inc[i++];
				var cond=inc[i++];
				ins=ins.set_next(new Instruction(name,[]));			
				ins.condition=cond;
				var innerif=[];
				var innerel=[];
				if(inc[i]=="{") {
					i++;
					var pcnt=1;
					while(i<inc.length && pcnt>0){
						if(inc[i]=="{") {
							pcnt++;
						} else if(inc[i]=="}") {
							pcnt--;
						}			
						if(pcnt>0) {
							innerif.push(inc[i]);
						}
						i++;
					}
					if(inc[i]=="else") {
						i++;
						if(inc[i]=="{") {
							i++;
							var pcnt=1;
							while(i<inc.length && pcnt>0){
								if(inc[i]=="{") {
									pcnt++;
								} else if(inc[i]=="}") {
									pcnt--;
								}			
								if(pcnt>0) {
									innerel.push(inc[i]);
								}
								i++;
							}
						}
					}
					else {
						/// ERROR
					}
					i--;					
				}
				else {
					/// ERROR 
				}
				//console.log(innerif)
				//console.log(innerel)
				
				var ifc = new Instruction("block",[]);
				var elc = new Instruction("block",[]);
				var acc = new Instruction("accumulator",[]);
				
				ifc.innercode=innerif;
				elc.innercode=innerel;
				
				ifc.isCompiling=true;
				var last_if = ifc.compile();				
				ifc.isCompiling=false;				
				
				
				elc.isCompiling=true;
				var last_el = elc.compile();			
				elc.isCompiling=false;				
				last_el.next = acc;
				
				ins.next = ifc;
				ins.nextnc=elc;
				
				ins=ins.set_next(ifc);
				ins=last_if.set_next(acc);
			}
		}
		return ins;
	}
}

function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

function __builtin_read_int(msg) {
	return parseInt(window.prompt(msg,"0"));
}

function __builtin_write(msg) {
	consoleWrite(msg);	
	
	document.getElementById('CodeRes').style.display = 'none';
	document.getElementById('CodeRes').style.display = 'block';
}

function __builtin_writeln() {
	consoleWriteLine("");	
}

function consoleClear() {
	document.getElementById("CodeRes").innerHTML="";
}

function consoleWrite(str){
	document.getElementById("CodeRes").innerHTML+=str;
}

function consoleWriteLine(str){
	document.getElementById("CodeRes").innerHTML+=str+"<br/>";
}

function consoleWriteError(str){	
	document.getElementById("CodeRes").innerHTML+=`<span style="color:red">${str}</span><br/>`;
}