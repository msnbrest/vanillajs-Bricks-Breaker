// from github by KaticNikola at 2024-04-05
// edit by msnbrest ( fix game_over and retry, mix sounds + ogg, sort code, better header + init, cursor paddle, add move when collision, to objs, help... )

let joueurs= { aqui:null, list:null }, imgs= {}, sons= {}, cvs, cxt, paddle, ball, brick, soundg, keys, sys, isLevelDone= true;



// TODO ball.speed when bonus/malus

const _sel= sel=> document.querySelector(sel),



init= _=>{

	let str_nb= prompt("Combien de joueurs?",1);
	let lost_sound= "sounds/life_lost.ogg";
	let brik_sound= "sounds/brick_hit.ogg";
	if( str_nb==42 ){
		str_nb= "1";
		lost_sound= "sounds/life_lost_fart.mp3";
		brik_sound= "sounds/brick_hit_poc.mp3";
	}
	joueurs.list= str_nb>0? [...Array(+str_nb)].map( vv=> [] ): [[]];

	pre_load();
	// load imgs sounds
	let blocs= {
		"imgs": { globa: imgs, init: _=>{ return new Image(); } },
		"sons": { globa: sons, init: _=>{ return new Audio(); } },
	};

	[
		{ bloctype: "imgs", dest: "bg", from: "img/bg.jpg" },
		{ bloctype: "imgs", dest: "bg1", from: "img/bg1.jpg" },
		{ bloctype: "imgs", dest: "level", from: "img/level.png" },
		{ bloctype: "imgs", dest: "life", from: "img/life.png" },
		{ bloctype: "imgs", dest: "score", from: "img/score.png" },
		{ bloctype: "sons", dest: "wall", from: "sounds/wall.mp3" },
		{ bloctype: "sons", dest: "life", from: lost_sound },
		{ bloctype: "sons", dest: "paddle", from: "sounds/paddle_hit1.mp3" },
		{ bloctype: "sons", dest: "win", from: "sounds/win.ogg" },
		{ bloctype: "sons", dest: "brick", from: brik_sound },
	].forEach( obj=>{

		// create element and attributes
		blocs[ obj.bloctype ].globa[ obj.dest ]= blocs[ obj.bloctype ].init(); // ex: imgs["bg"]= new Image();
		blocs[ obj.bloctype ].globa[ obj.dest ].src= obj.from;
		blocs[ obj.bloctype ].globa[ obj.dest ].n= 0; // audio utile antispam
		if( obj.bloctype=="sons" ){ blocs[ obj.bloctype ].globa[ obj.dest ].muted= true; }
		sys.loadwait++;

		// join trigger
		if( obj.bloctype=="imgs" ){
			blocs[ obj.bloctype ].globa[ obj.dest ].onload= _=>{   sys.loaded++;   sys.loaded>=sys.loadwait &&( init_part2() );   };
		}
		if( obj.bloctype=="sons" ){
			blocs[ obj.bloctype ].globa[ obj.dest ].onloadedmetadata= _=>{   sys.loaded++;   sys.loaded>=sys.loadwait &&( init_part2() );   };
		}
	} );
},



init_part2= _=>{

	// set draw zone
	cvs= _sel("#game");

	cxt= cvs.getContext('2d');

	cvs.style.boxShadow= '1px solid #0ff';
	cxt.lineWidth= 2;



	// actions buttons & mouse
	soundg= {   btn: _sel('#soundBtn'),   is: false   };

	soundg.btn.addEventListener('click', osef=>{
		soundg.is= !soundg.is;
		soundg.btn.setAttribute('src', soundg.is ? "img/sounds_on.svg" : "img/sounds_off.svg" );
		Object.keys(sons).forEach( son=>{ sons[son].muted= !soundg.is; } );
	});

	_sel(".table").addEventListener('click', e=>{ sys.game_over &&(   retry(true,event)   ); });

	document.addEventListener("keydown", e=>{
		e.keyCode == 37 &&( keys.left= true );
		e.keyCode == 39 &&( keys.right= true );
		e.keyCode == 96 && sys.game_over &&(   retry(true,null)   );
	});

	document.addEventListener("keyup", e=>{
		e.keyCode == 37 &&( keys.left= false );
		e.keyCode == 39 &&( keys.right= false);
	});

	document.addEventListener("mousemove", mousemoved);

	retry(false,null);

},



mousemoved= event=>{ paddle.x= Math.max( 0, Math.min( event.clientX-cvs.offsetLeft-paddle.width/2, cvs.width-paddle.width ) ); },



drawBall= _=>{

	cxt.beginPath();
	cxt.arc(ball.x, ball.y, ball.radius-2, 0, Math.PI * 2);
	cxt.fillStyle= '#ffcd05';
	cxt.fill();
	cxt.strokeStyle= '#2e3548';
	cxt.stroke();
	cxt.closePath();
},



drawPaddle= _=>{

	cxt.fillStyle= '#2e3548';
	cxt.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
	cxt.strokeStyle= '#ffcd05';
	cxt.strokeRect(paddle.x, paddle.y, paddle.width, paddle.height);
},



collision_and_drawBricks= _=>{

	isLevelDone= true;
	cxt.fillStyle= brick.fillColor;
	cxt.strokeStyle= brick.strokeColor;
	for( let r= 0; r < brick.row; r++ ){
		for( let c= 0; c < brick.columns; c++ ){
			strike_or_draw_brick( sys.bricks[r][c] );
			isLevelDone= isLevelDone && !sys.bricks[r][c].status;
		}
	}
},



showGameStats= (txt, txtX, txtY, img, imgX, imgY)=>{

	//text
	cxt.fillStyle= 'fff';
	cxt.font= '25px Germania One';
	cxt.fillText(txt, txtX, txtY);

	//image
	cxt.drawImage(img, imgX, imgY, 25, 25)
},



movePaddle= _=>{

	if( keys.right && paddle.x + paddle.width < cvs.width ){
		paddle.x += paddle.vx;
	}else if( keys.left && paddle.x > 0 ){
		paddle.x -= paddle.vx;
	}
},



moveBall= _=>{

	ball.x+= ball.dx;
	ball.y+= ball.dy;
	ball.px= ball.x + ball.dx;
	ball.py= ball.y + ball.dy;
},



ball_new_dir= ( inv_dx, inv_dy, new_dx=null, new_dy=null )=>{

	inv_dx &&( ball.dx= -ball.dx);
	inv_dy &&( ball.dy= -ball.dy);
	new_dx==null ||( ball.dx= new_dx );
	new_dy==null ||( ball.dy= new_dy );

	ball.px= ball.x + ball.dx;
	ball.py= ball.y + ball.dy;
},



collisionBallWall= _=>{

	if( ball.px - ball.radius < 0 ){
		ball_new_dir( false, false, Math.abs(ball.dx), ball.dy );
		sons.wall.n++;
	}
	if( ball.px + ball.radius > cvs.width ){
		ball_new_dir( false, false, -Math.abs(ball.dx), ball.dy );
		sons.wall.n++;
	}
	if( ball.py - ball.radius < 0 ){
		ball_new_dir( false, false, ball.dx, Math.abs(ball.dy) );
		sons.wall.n++;
	}
	if( ball.py + ball.radius > cvs.height ){
		sons.life.n++;
		sys.life--;
		resetBall();
	}
},



collisionBallPaddle= _=>{

	if( ball.px - ball.radius < paddle.x + paddle.width &&
		ball.px + ball.radius > paddle.x &&
		ball.py - ball.radius < paddle.y + paddle.height &&
		ball.py + ball.radius > paddle.y ){
		sons.paddle.n++
		let impact_angle= ( ( ball.px - (paddle.x + paddle.width / 2) ) / (paddle.width / 2) ) * Math.PI / 3 //60deg
		ball_new_dir( false, false, Math.sin(impact_angle) * ball.speed, -Math.cos(impact_angle) * ball.speed );
	}
},



strike_or_draw_brick= b=>{

	if( !b.status ){ return; }

	if(
		ball.px + ball.radius > b.x &&
		ball.px - ball.radius < b.x + brick.width &&
		ball.py + ball.radius > b.y &&
		ball.py - ball.radius < b.y + brick.height
	){
		sons.brick.n++;
		if( ball.x + ball.radius <= b.x ){ ball_new_dir( false, false, -Math.abs(ball.dx), ball.dy ); }
		if( ball.x - ball.radius >= b.x + brick.width ){ ball_new_dir( false, false, Math.abs(ball.dx), ball.dy ); }
		if( ball.y + ball.radius <= b.y ){ ball_new_dir( false, false, ball.dx, -Math.abs(ball.dy) ); }
		if( ball.y - ball.radius >= b.y + brick.height ){ ball_new_dir( false, false, ball.dx, Math.abs(ball.dy) ); }

		b.status= false;
		sys.score++;
		levelUp.testable= true;
	}

	if( b.status ){
		cxt.fillRect( b.x, b.y,brick.width, brick.height);
		cxt.strokeRect( b.x, b.y, brick.width, brick.height);
	}
},



levelUp= {
	testable: false,
	test: _=>{

		if( !levelUp.testable ){ return; }

		if( isLevelDone ){
			sons.win.n++;
			if( sys.level > sys.max_level ){
				sys.game_over= true;
				return;
			}
			brick.row++;
			createBricks();
			resetBall();
			sys.level++;
			if( sys.life<3 ){ sys.life= 3; }   sys.life++;
		}
		levelUp.testable= false;
	}
},



createBricks= _=>{

	for( let r= 0; r < brick.row; r++ ){
		sys.bricks[r]= [];
		for( let c= 0; c < brick.columns; c++ ){
			sys.bricks[r][c]= {
				x: c * (brick.offsetLeft + brick.width) + brick.offsetLeft,
				y: r * (brick.offsetTop + brick.height) + brick.offsetTop + brick.marginTop,
				status: true
			}
		}
	}

},



resetBall= _=>{

	ball.x= paddle.x + paddle.width/2 + 0.01;
	ball.y= paddle.y - ball.radius;
	ball_new_dir( false, false, 0, -ball.speed*.8 ); // friendly start speed
},



pre_load= _=>{

	keys= { left: false, right: false };

	sys= {
		life: 3, score: 0, level: 0,
		loaded: 0, loadwait: 0,
		max_level: 10, game_over: true, bricks: [], fps8: 0
	};
},



retry= (lezgo,event)=>{

	lezgo &&( joueurs.aqui= joueurs.aqui==null? 0: ((joueurs.aqui+1)%joueurs.list.length) );

	pre_load();

	paddle= {
		x: null,
		y: null,
		width: 100,
		height: 20,

		vx: 5, //define movement
	};
	if( event ){
		mousemoved(event);
	}else{
		paddle.x= cvs.width / 2 - paddle.width / 2;
	}
	paddle.y= cvs.height - paddle.height - 10;



	ball= {
		x: null,
		y: null,
		radius: 11,
		speed: 6,
		px: null,
		py: null,
	};
	resetBall();



	brick= {
		row: 2,
		columns: 8,
		width: 55,
		height: 20,
		offsetLeft: 10,
		offsetTop: 10,
		marginTop: 40,
		fillColor: "#2e3548",
		strokeColor: "#fff",
	};

	createBricks();

	if( lezgo ){
		_sel(".help") &&( _sel(".help").innerHTML= "" );
		sys.game_over= false;
		loop(true);
	}else{
		loop(false);
	}
},



goplay= son=>{   son.n>0 &&(   son.currentTime= 0,   son.play(),   son.n--   );   },



tick_fps8= _=>{

	goplay(sons.wall);
	goplay(sons.life);
	goplay(sons.paddle);
	goplay(sons.win);
	goplay(sons.brick);
},



calc_show_scores= _=>{

	joueurs.list[joueurs.aqui].push({ life: sys.life, score: sys.score, level: sys.level });
	_sel(".help").innerHTML= "End of Game.<br><br>Click to replay<br><br>"
		+ joueurs.list.map( (vv,kk)=> `joueur ${kk+1}:<br>`
			+ vv.map( v2=> `&#62; ${v2.score} points à ${v2.life} vies au lvl ${v2.level+1}` ).join("<br>")
		).join("<br><br>");
},



loop= more=>{

	movePaddle();
	moveBall();
	collisionBallWall();
	collisionBallPaddle();

	cxt.drawImage(imgs.bg, 0, 0, cvs.width, cvs.height);
	collision_and_drawBricks();
	drawBall();
	drawPaddle();

	showGameStats(sys.score, 45, 35, imgs.score, 15, 13);
	showGameStats(sys.level+1, cvs.width / 2, 35, imgs.level, cvs.width / 2 - 30, 13);
	showGameStats(sys.life, cvs.width - 45, 35, imgs.life, cvs.width - 75, 13);

	levelUp.test();
	sys.fps8++;   if( sys.fps8>7 ){   tick_fps8();   sys.fps8= 0;   }

	(sys.life < 1)&&( sys.game_over= true, calc_show_scores() );

	sys.game_over ||( more &&( requestAnimationFrame(loop) ) );
};
