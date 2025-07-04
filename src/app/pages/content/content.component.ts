import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrl: './content.component.css',
  imports: [ ReactiveFormsModule, FormsModule, CommonModule],
})
export class ContentComponent {
  form: FormGroup;

  interesses = [
    { label: 'Música', value: 'musica' },
    { label: 'Ciência', value: 'ciencia' },
    { label: 'Esporte', value: 'esporte' },
    { label: 'Livros', value: 'livros' },
    { label: 'Arte', value: 'arte' },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      nome: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      senha: ['', Validators.required],
      data_nascimento: ['', Validators.required],
      genero: ['', Validators.required],
      interesses: this.fb.group({}),
      comentarios: [''],
    });

    // Inicializa os checkboxes
    this.interesses.forEach((interesse) => {
      (this.form.get('interesses') as FormGroup).addControl(
        interesse.value,
        this.fb.control(false)
      );
    });
  }

  onSubmit() {
    if (this.form.valid) {
      console.log(this.form.value);
    } else {
      alert('Formulário inválido');
    }
  }
}
